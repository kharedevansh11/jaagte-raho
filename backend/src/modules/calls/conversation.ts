// What makes each check-in feel like the same friend calling again, not a script on repeat:
// memory of the last call, awareness of the hour, and a question that never repeats in a night.
import type { Call } from '../../generated/prisma/client.js';
import type { AlertLevel } from '../../generated/prisma/enums.js';

/**
 * Easy everyday questions. A sleepy driver answers these slowly, vaguely or off-topic,
 * which is the signal we score, without anything that feels like a test.
 */
export const QUESTIONS = [
  'Raat ko khane mein kya khaya?',
  'Agla bada sheher ya dhaba kaunsa aane wala hai?',
  'Gaadi mein abhi kaunsa gaana chal raha hai?',
  'Aaj ka safar kahan se shuru kiya tha?',
  'Ghar pe sab kaise hain?',
  'Aaj chai kitni baar pee?',
  'Raste mein traffic kaisa hai abhi?',
  'Wahan mausam kaisa hai, thand hai ya garmi?',
  'Is raste pe aapka pasandida dhaba kaunsa hai?',
  'Aaj raat ki manzil kahan tak hai?',
  'Subah tak kahan pahunchne ka plan hai?',
  'Pichhle dhabe pe kya khaya tha?',
  'Raste mein aaj koi accha nazaara dikha?',
  'Is trip ke baad ghar kab jaayenge?',
  'Aaj ka din kaisa raha?',
] as const;

/** A question not yet asked tonight; once the pool runs out, start over. */
export function pickQuestion(
  askedTonight: (string | null)[],
  random = Math.random,
): string {
  const asked = new Set(askedTonight.filter(Boolean));
  const fresh = QUESTIONS.filter((q) => !asked.has(q));
  const pool = fresh.length ? fresh : QUESTIONS;
  return pool[Math.floor(random() * pool.length)];
}

export function timeOfNight(hour: number): string {
  if (hour >= 19 && hour < 23) return 'late evening';
  if (hour >= 23 || hour < 3) return 'the middle of the night';
  if (hour >= 3 && hour < 7) return 'early morning, close to sunrise';
  return 'daytime';
}

const MOOD: Record<AlertLevel, string> = {
  GREEN: 'sounded fresh and fine',
  AMBER: 'sounded a little tired',
  RED: 'sounded very sleepy',
  MISSED: 'did not pick up',
};

const ordinal = (n: number) => ['first', 'second', 'third'][n - 1] ?? `${n}th`;

/**
 * Variables for one check-in call, from the driver's calls in the last 12 hours (newest first).
 * Every value is plain text the agent prompt can drop into a sentence.
 */
export function checkInContext(
  recent: Call[],
  hourIST: number,
  now: Date,
  random = Math.random,
) {
  const tonight = recent.filter(
    (c) =>
      c.kind === 'CHECK_IN' &&
      now.getTime() - c.createdAt.getTime() < 12 * 3600_000,
  );
  const last = tonight.find((c) => c.completedAt && c.level);
  const place =
    last?.location && last.location !== 'unknown' ? last.location : null;
  return {
    call_number: ordinal(tonight.length + 1),
    time_of_night: timeOfNight(hourIST),
    last_call: last
      ? `${Math.round((now.getTime() - last.createdAt.getTime()) / 60_000)} minutes ago they ${MOOD[last.level!]}${place ? `, near ${place}` : ''}`
      : 'none, this is the first call tonight',
    check_question: pickQuestion(
      tonight.map((c) => c.question),
      random,
    ),
  };
}
