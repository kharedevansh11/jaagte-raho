import type { JobsOptions } from 'bullmq';
import type { AlertLevel } from '../../generated/prisma/enums.js';

/** One queue for everything that happens after Bolna talks back to us. */
export const CALLS_QUEUE = 'calls';

export const JOB = {
  /** A Bolna webhook payload: status update, or the final result of a call. */
  execution: 'bolna-execution',
  /** Phone the fleet manager. Its own job so a Bolna hiccup is retried, not lost. */
  ownerAlert: 'owner-alert',
} as const;

export interface OwnerAlertJob {
  driverId: string;
  level: AlertLevel;
  location: string | null;
}

export const RETRY: JobsOptions = {
  attempts: 5,
  backoff: { type: 'exponential', delay: 2_000 },
  // Keep a short history for debugging; failed jobs stay until someone looks at them.
  removeOnComplete: { age: 24 * 3600, count: 1000 },
  removeOnFail: false,
};

/** BullMQ wants host/port options, while hosts hand out a URL. */
export function redisConnection(url: string) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: Number(u.port || 6379),
    username: u.username || undefined,
    password: u.password ? decodeURIComponent(u.password) : undefined,
    db: u.pathname.length > 1 ? Number(u.pathname.slice(1)) : 0,
    ...(u.protocol === 'rediss:' && { tls: {} }),
  };
}
