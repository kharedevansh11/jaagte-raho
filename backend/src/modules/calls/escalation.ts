import { AlertLevel } from '../../generated/prisma/enums.js';

export interface EscalationInput {
  level: AlertLevel | null;
  previousLevel: AlertLevel | null;
  lastAlertAt: Date | null;
  hasOwner: boolean;
  now: Date;
  intervalMin: number;
  recallMin: number;
  cooldownMin: number;
}

export interface EscalationDecision {
  nextCallAt: Date;
  alertOwner: boolean;
}

const addMinutes = (d: Date, m: number) => new Date(d.getTime() + m * 60_000);

/** What happens after a check-in: when to call next, and whether to wake the owner. */
export function decideEscalation(i: EscalationInput): EscalationDecision {
  const worrying = i.level === AlertLevel.RED || i.level === AlertLevel.MISSED;
  const missedTwice =
    i.level === AlertLevel.MISSED && i.previousLevel === AlertLevel.MISSED;
  const coolingDown =
    i.lastAlertAt !== null &&
    i.now.getTime() - i.lastAlertAt.getTime() < i.cooldownMin * 60_000;

  return {
    nextCallAt: addMinutes(
      i.now,
      worrying || i.level === AlertLevel.AMBER ? i.recallMin : i.intervalMin,
    ),
    alertOwner:
      i.hasOwner && !coolingDown && (i.level === AlertLevel.RED || missedTwice),
  };
}
