/** Minutes since midnight for `date` in `timeZone`. */
export function minutesInZone(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value);
  return get('hour') * 60 + get('minute');
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** True if `now` falls in [start, end). An end at or before the start wraps past midnight. */
export function inShift(now: number, start: string, end: string): boolean {
  const s = toMinutes(start);
  const e = toMinutes(end);
  return s < e ? now >= s && now < e : now >= s || now < e;
}
