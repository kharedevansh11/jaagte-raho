import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { BolnaModule } from '../bolna/bolna.module.js';
import { BolnaWebhookController } from './bolna-webhook.controller.js';
import { CallsRepository } from './calls.repository.js';
import { CallsResolver } from './calls.resolver.js';
import { CallsService } from './calls.service.js';
import { CheckInScheduler } from './check-in.scheduler.js';
import { CallsProcessor } from './calls.processor.js';
import { CALLS_QUEUE } from './calls.queue.js';

@Module({
  imports: [BolnaModule, BullModule.registerQueue({ name: CALLS_QUEUE })],
  controllers: [BolnaWebhookController],
  providers: [
    CallsRepository,
    CallsService,
    CallsResolver,
    CheckInScheduler,
    CallsProcessor,
  ],
  exports: [CallsService, CallsRepository],
})
export class CallsModule {}
