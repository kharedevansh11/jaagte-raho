import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { Env } from '../../config/env.validation.js';
import { CallsRepository } from './calls.repository.js';
import { CallsService } from './calls.service.js';
import { inShift, minutesInZone } from './shift.js';

@Injectable()
export class CheckInScheduler {
  private readonly logger = new Logger(CheckInScheduler.name);
  private running = false;

  constructor(
    private readonly calls: CallsRepository,
    private readonly callsService: CallsService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  // ponytail: in-process cron, so run a single backend instance. Move to a queue if you scale out.
  @Cron(CronExpression.EVERY_MINUTE)
  async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const now = new Date();
      const nowMin = minutesInZone(
        now,
        this.config.get('APP_TIMEZONE', { infer: true }),
      );
      const interval = this.config.get('CALL_INTERVAL_MINUTES', {
        infer: true,
      });
      const due = await this.calls.findDueDrivers(now);

      for (const driver of due.filter((d) =>
        inShift(nowMin, d.shiftStart, d.shiftEnd),
      )) {
        // Book the next slot before dialing, so a failed or slow dial never double-calls.
        await this.calls.updateDriverSchedule(driver.id, {
          nextCallAt: new Date(now.getTime() + interval * 60_000),
        });
        await this.callsService
          .callDriver(driver, 'CHECK_IN')
          .catch((err: Error) =>
            this.logger.error(
              `Check-in for driver ${driver.id} failed: ${err.message}`,
            ),
          );
      }
    } finally {
      this.running = false;
    }
  }
}
