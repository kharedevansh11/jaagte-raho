import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import type { BolnaExecution } from '../bolna/bolna.types.js';
import { CALLS_QUEUE, JOB, type OwnerAlertJob } from './calls.queue.js';
import { CallsService } from './calls.service.js';

/** Works through webhook results and owner alerts; a thrown error means BullMQ retries with backoff. */
@Processor(CALLS_QUEUE, { concurrency: 5 })
export class CallsProcessor extends WorkerHost {
  private readonly logger = new Logger(CallsProcessor.name);

  constructor(private readonly calls: CallsService) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case JOB.execution:
        return this.calls.handleExecution(job.data as BolnaExecution);
      case JOB.ownerAlert:
        return this.calls.placeOwnerAlert(
          job.data as OwnerAlertJob,
          job.attemptsMade + 1 >= (job.opts.attempts ?? 1),
        );
      default:
        this.logger.warn(`Unknown job ${job.name}, skipping`);
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    const final = job.attemptsMade >= (job.opts.attempts ?? 1);
    this.logger.error(
      `${job.name} ${job.id} failed (attempt ${job.attemptsMade}${final ? ', giving up' : ', will retry'}): ${err.message}`,
    );
  }
}
