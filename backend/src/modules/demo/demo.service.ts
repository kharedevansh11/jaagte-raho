import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.validation.js';
import { CallsRepository } from '../calls/calls.repository.js';
import { CallsService } from '../calls/calls.service.js';
import { DriversService } from '../drivers/drivers.service.js';
import type { DemoCallDto } from './dto/demo-call.dto.js';

const HOUR = 60 * 60_000;
const DAY = 24 * HOUR;

/** Public "try it now" calls, rate limited so strangers can't drain Bolna credits. */
@Injectable()
export class DemoService {
  constructor(
    private readonly drivers: DriversService,
    private readonly calls: CallsService,
    private readonly callsRepo: CallsRepository,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async call(dto: DemoCallDto) {
    const now = Date.now();
    if (
      (await this.callsRepo.countDemoCallsSince(
        new Date(now - HOUR),
        dto.phone,
      )) > 0
    ) {
      throw new HttpException(
        'One demo call per number per hour',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    const dailyCap = this.config.get('DEMO_CALLS_PER_DAY', { infer: true });
    if (
      (await this.callsRepo.countDemoCallsSince(new Date(now - DAY))) >=
      dailyCap
    ) {
      throw new HttpException(
        'Demo is busy today, try tomorrow',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const existing = await this.drivers.findByPhone(dto.phone);
    if (existing && !existing.isDemo) {
      // Never let the public form ring or overwrite a real driver.
      throw new HttpException(
        'This number is registered as a driver',
        HttpStatus.CONFLICT,
      );
    }
    // A returning visitor may pick a different name or language this time.
    const driver = existing
      ? await this.drivers.updateDemo(existing.id, {
          name: dto.name,
          language: dto.language,
        })
      : await this.drivers.createDemo(dto);
    const call = await this.calls.callDriver(driver, 'CHECK_IN');
    return { callId: call.id };
  }

  /** Result for the try-it page. Leaves out phone numbers and recordings on purpose. */
  async result(callId: string) {
    const call = await this.calls.findById(callId);
    if (!call || call.kind !== 'CHECK_IN') throw new NotFoundException();
    const { status, level, score, reasons, summary, transcript, completedAt } =
      call;
    return { status, level, score, reasons, summary, transcript, completedAt };
  }
}
