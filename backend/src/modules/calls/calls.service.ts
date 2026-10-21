import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation.js';
import type { Call as CallRow, Driver } from '../../generated/prisma/client.js';
import { CallKind } from '../../generated/prisma/enums.js';
import { LANGUAGES, type LanguageCode } from '../../common/languages.js';
import { BolnaClient } from '../bolna/bolna.client.js';
import {
  TERMINAL_STATUSES,
  type BolnaExecution,
} from '../bolna/bolna.types.js';
import { assessCall } from './alertness.js';
import type { Call } from './call.model.js';
import { CallsRepository } from './calls.repository.js';
import { decideEscalation } from './escalation.js';
import { decodeCursor, encodeCursor } from './cursor.js';
import { checkInContext } from './conversation.js';
import { minutesInZone } from './shift.js';
import { CALLS_QUEUE, JOB, RETRY, type OwnerAlertJob } from './calls.queue.js';

@Injectable()
export class CallsService {
  private readonly logger = new Logger(CallsService.name);

  constructor(
    private readonly calls: CallsRepository,
    private readonly bolna: BolnaClient,
    private readonly config: ConfigService<Env, true>,
    @InjectQueue(CALLS_QUEUE) private readonly queue: Queue,
  ) {}

  /**
   * Accepts a webhook in milliseconds and leaves the work to the queue worker.
   * The job id makes repeat deliveries of the same status a no-op.
   */
  async enqueueExecution(exec: BolnaExecution): Promise<void> {
    try {
      await this.queue.add(JOB.execution, exec, {
        ...RETRY,
        jobId: `${exec.id}_${exec.status}`,
      });
    } catch (err) {
      // ponytail: Redis down means no retries, but processing inline beats dropping a result.
      this.logger.error(
        `Queue unavailable, handling ${exec.id} inline: ${(err as Error).message}`,
      );
      await this.handleExecution(exec);
    }
  }

  /** Welcome or check-in call to the driver. */
  async callDriver(
    driver: Driver,
    kind: 'WELCOME' | 'CHECK_IN',
  ): Promise<Call> {
    const now = new Date();
    // Check-ins carry memory of the night so far, so no two calls sound the same.
    const context =
      kind === CallKind.CHECK_IN
        ? checkInContext(
            await this.calls.listForDriver(driver.id, 20),
            Math.floor(
              minutesInZone(
                now,
                this.config.get('APP_TIMEZONE', { infer: true }),
              ) / 60,
            ),
            now,
          )
        : null;
    return this.place(
      driver,
      kind,
      {
        agentId: this.config.get('BOLNA_CHECKIN_AGENT_ID', { infer: true }),
        to: driver.phone,
        language: driver.language,
        userData: {
          driver_name: driver.name,
          language: LANGUAGES[driver.language as LanguageCode] ?? 'Hindi',
          call_type: kind === CallKind.WELCOME ? 'welcome' : 'check_in',
          ...context,
        },
      },
      context?.check_question,
    );
  }

  listForDriver(driverId: string, take: number) {
    return this.calls
      .listForDriver(driverId, take)
      .then((rows) => rows.map(toModel));
  }

  /**
   * One page of a driver's history. Fetches one extra row to know whether
   * another page exists, without a separate count query.
   */
  async page(driverId: string, take: number, after: string | null) {
    const rows = await this.calls.listPage(
      driverId,
      take + 1,
      after ? decodeCursor(after) : null,
    );
    const items = rows.slice(0, take);
    const last = items[items.length - 1];
    return {
      items: items.map(toModel),
      nextCursor: rows.length > take && last ? encodeCursor(last) : null,
    };
  }

  /** The driver, if it belongs to this owner. */
  async ownedDriver(driverId: string, ownerId: string) {
    const driver = await this.calls.findDriver(driverId);
    return driver?.ownerId === ownerId ? driver : null;
  }

  listRecent(take: number, ownerId: string) {
    return this.calls
      .listRecent(take, ownerId)
      .then((rows) => rows.map(toModel));
  }

  async findById(id: string) {
    const row = await this.calls.findById(id);
    return row && toModel(row);
  }

  /**
   * Applies a Bolna status update. Safe to run twice, and safe when several workers
   * race on the same call: only the one that claims completion scores it and escalates.
   */
  async handleExecution(exec: BolnaExecution): Promise<void> {
    const call = await this.calls.findByExecutionId(exec.id);
    if (!call || call.completedAt) return;

    if (!TERMINAL_STATUSES.has(exec.status)) {
      await this.calls.updateStatusIfOpen(call.id, exec.status);
      return;
    }

    const isCheckIn = call.kind === CallKind.CHECK_IN;
    const result = isCheckIn ? assessCall(exec) : null;
    const claimed = await this.calls.claimCompletion(call.id, {
      status: exec.status,
      transcript: exec.transcript ?? null,
      summary: exec.summary ?? null,
      durationSec: exec.conversation_duration ?? null,
      recordingUrl: exec.telephony_data?.recording_url ?? null,
      ...(result && {
        level: result.level,
        score: result.score,
        reasons: result.reasons.join('\n'),
        location: result.location,
        passenger: result.passenger,
      }),
    });
    if (!claimed) return;
    if (result?.level)
      await this.escalate(call.driver, result.level, result.location);
  }

  private async escalate(
    driver: Driver,
    level: NonNullable<CallRow['level']>,
    location: string | null,
  ) {
    const now = new Date();
    const decision = decideEscalation({
      level,
      previousLevel: driver.lastLevel,
      lastAlertAt: driver.lastAlertAt,
      hasOwner: Boolean(driver.ownerPhone),
      now,
      intervalMin: this.config.get('CALL_INTERVAL_MINUTES', { infer: true }),
      recallMin: this.config.get('RECALL_MINUTES', { infer: true }),
      cooldownMin: this.config.get('ALERT_COOLDOWN_MINUTES', { infer: true }),
    });

    await this.calls.updateDriverSchedule(driver.id, {
      lastLevel: level,
      lastCallAt: now,
      nextCallAt: decision.nextCallAt,
      ...(decision.alertOwner && { lastAlertAt: now }),
    });
    if (!decision.alertOwner) return;

    const job: OwnerAlertJob = { driverId: driver.id, level, location };
    await this.queue.add(JOB.ownerAlert, job, RETRY);
  }

  /** Runs in the queue worker; throwing makes BullMQ retry with backoff. */
  async placeOwnerAlert(
    { driverId, level, location }: OwnerAlertJob,
    lastAttempt = true,
  ): Promise<void> {
    const driver = await this.calls.findDriver(driverId);
    if (!driver?.ownerPhone) return;
    await this.place(
      driver,
      CallKind.OWNER_ALERT,
      {
        agentId: this.config.get('BOLNA_ALERT_AGENT_ID', { infer: true }),
        to: driver.ownerPhone,
        userData: {
          owner_name: driver.ownerName ?? 'Sir',
          driver_name: driver.name,
          reason:
            level === 'MISSED'
              ? 'has not been able to pick up our last two calls'
              : 'sounded very tired on our last call',
          last_location: location ?? 'unknown',
        },
      },
      undefined,
      // Retries shouldn't leave a "we called the manager" row each; only the final failure shows.
      lastAttempt,
    );
  }

  /** Records the call first so a failed dial still shows up on the dashboard. */
  private async place(
    driver: Driver,
    kind: CallKind,
    params: Parameters<BolnaClient['placeCall']>[0],
    question?: string,
    recordFailure = true,
  ): Promise<Call> {
    const row = await this.calls.create({
      driverId: driver.id,
      kind,
      question,
    });
    try {
      const executionId = await this.bolna.placeCall(params);
      return toModel(await this.calls.update(row.id, { executionId }));
    } catch (err) {
      if (recordFailure) {
        await this.calls.update(row.id, {
          status: 'dial-failed',
          completedAt: new Date(),
        });
      } else {
        await this.calls.delete(row.id);
      }
      throw err;
    }
  }
}

function toModel(row: CallRow): Call {
  return { ...row, reasons: row.reasons ? row.reasons.split('\n') : [] };
}
