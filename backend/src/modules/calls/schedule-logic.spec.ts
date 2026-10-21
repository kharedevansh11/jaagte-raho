import { decideEscalation } from './escalation.js';
import { inShift, minutesInZone } from './shift.js';

describe('inShift', () => {
  it('handles an overnight shift', () => {
    expect(inShift(23 * 60, '22:00', '06:00')).toBe(true);
    expect(inShift(3 * 60, '22:00', '06:00')).toBe(true);
    expect(inShift(6 * 60, '22:00', '06:00')).toBe(false);
    expect(inShift(12 * 60, '22:00', '06:00')).toBe(false);
  });

  it('handles a same-day shift', () => {
    expect(inShift(10 * 60, '09:00', '17:00')).toBe(true);
    expect(inShift(17 * 60, '09:00', '17:00')).toBe(false);
  });

  it('reads the clock in IST', () => {
    expect(
      minutesInZone(new Date('2026-10-16T20:00:00Z'), 'Asia/Kolkata'),
    ).toBe(90); // 01:30 IST
  });
});

describe('decideEscalation', () => {
  const now = new Date('2026-10-16T20:00:00Z');
  const base = {
    previousLevel: null,
    lastAlertAt: null,
    hasOwner: true,
    now,
    intervalMin: 20,
    recallMin: 10,
    cooldownMin: 30,
  } as const;
  const minsLater = (d: Date) => (d.getTime() - now.getTime()) / 60_000;

  it('waits the full interval after a GREEN call', () => {
    const d = decideEscalation({ ...base, level: 'GREEN' });
    expect(d).toEqual({ nextCallAt: expect.any(Date), alertOwner: false });
    expect(minsLater(d.nextCallAt)).toBe(20);
  });

  it('calls back sooner after AMBER without waking the owner', () => {
    const d = decideEscalation({ ...base, level: 'AMBER' });
    expect([minsLater(d.nextCallAt), d.alertOwner]).toEqual([10, false]);
  });

  it('alerts the owner on RED', () => {
    expect(decideEscalation({ ...base, level: 'RED' }).alertOwner).toBe(true);
  });

  it('alerts only on the second missed call in a row', () => {
    expect(decideEscalation({ ...base, level: 'MISSED' }).alertOwner).toBe(
      false,
    );
    expect(
      decideEscalation({ ...base, level: 'MISSED', previousLevel: 'MISSED' })
        .alertOwner,
    ).toBe(true);
  });

  it('respects the cooldown and drivers without an owner', () => {
    const recent = new Date(now.getTime() - 10 * 60_000);
    expect(
      decideEscalation({ ...base, level: 'RED', lastAlertAt: recent })
        .alertOwner,
    ).toBe(false);
    expect(
      decideEscalation({ ...base, level: 'RED', hasOwner: false }).alertOwner,
    ).toBe(false);
  });
});
