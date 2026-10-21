import { AlertLevel } from '../../generated/prisma/enums.js';
import { MISSED_STATUSES, type BolnaExecution } from '../bolna/bolna.types.js';

export interface Alertness {
  level: AlertLevel | null;
  score: number | null;
  reasons: string[];
  passenger: boolean | null;
  location: string | null;
}

/**
 * Scores how awake the driver sounded on one check-in.
 * Signals come from the agent's extraction prompt (see docs/agents/check-in-agent.md)
 * plus how much the driver said and whether they went silent mid-call.
 * ponytail: no response-latency signal, Bolna's transcript has no per-turn timestamps.
 * Add it by running telephony_data.recording_url through Deepgram for word timings.
 */
export function assessCall(exec: BolnaExecution): Alertness {
  const passenger = toBool(extracted(exec.extracted_data, 'passenger_present'));
  const location = toText(extracted(exec.extracted_data, 'location'));
  const base = { passenger, location };

  if (MISSED_STATUSES.has(exec.status) || exec.answered_by_voice_mail) {
    return {
      ...base,
      level: AlertLevel.MISSED,
      score: 0,
      reasons: ['did not pick up'],
    };
  }
  if (exec.status !== 'completed') {
    // Our side failed (error, balance-low…); don't hold it against the driver.
    return {
      ...base,
      level: null,
      score: null,
      reasons: [`call ${exec.status}`],
    };
  }

  const replies = userReplies(exec.transcript ?? '');
  if (replies.length === 0) {
    return {
      ...base,
      level: AlertLevel.RED,
      score: 10,
      reasons: ['picked up but never spoke'],
    };
  }

  let score = 100;
  const reasons: string[] = [];
  const penalise = (points: number, reason: string) => {
    score -= points;
    reasons.push(reason);
  };

  // Going silent mid-call is the strongest signal we have: the extraction LLM
  // only reads text, so it can't hear a sleepy voice, but it can't miss silence.
  if (wentQuiet(exec)) penalise(50, 'went quiet during the call');
  if (toBool(extracted(exec.extracted_data, 'sounded_sleepy')) === true) {
    penalise(45, 'sounded sleepy');
  }
  if (toBool(extracted(exec.extracted_data, 'coherent')) === false) {
    penalise(30, 'replies did not make sense');
  }
  if (
    toText(extracted(exec.extracted_data, 'check_question'))?.toLowerCase() ===
    'wrong'
  ) {
    penalise(20, 'got the check question wrong');
  }
  const words = replies.reduce((n, r) => n + r.split(/\s+/).length, 0);
  if (words / replies.length < 2) penalise(10, 'very short replies');

  score = Math.max(score, 0);
  const level =
    score >= 80
      ? AlertLevel.GREEN
      : score >= 45
        ? AlertLevel.AMBER
        : AlertLevel.RED;
  return { ...base, level, score, reasons };
}

// The agent's "are you still on the line?" prompt, as configured in Bolna (Engine → User Online Detection).
const STILL_THERE = /still on the line|लाइन पर|line pe|line par/i;

function wentQuiet(exec: BolnaExecution): boolean {
  if (exec.telephony_data?.hangup_reason === 'inactivity_timeout') return true;
  return (exec.transcript ?? '')
    .split('\n')
    .some((line) => /^\s*assistant\s*:/i.test(line) && STILL_THERE.test(line));
}

function userReplies(transcript: string): string[] {
  return transcript
    .split('\n')
    .filter((line) => /^\s*user\s*:/i.test(line))
    .map((line) => line.replace(/^\s*user\s*:/i, '').trim())
    .filter(Boolean);
}

const normalise = (key: string) => key.toLowerCase().replace(/[\s_-]/g, '');

/**
 * Finds a key anywhere in Bolna's extracted_data. Bolna may nest fields under a
 * category and wrap values as { objective | subjective | value }, so search deep.
 */
export function extracted(data: unknown, key: string): unknown {
  if (!data || typeof data !== 'object') return undefined;
  for (const [k, v] of Object.entries(data)) {
    if (normalise(k) === normalise(key)) return unwrap(v);
  }
  for (const v of Object.values(data)) {
    const found = extracted(v, key);
    if (found !== undefined) return found;
  }
  return undefined;
}

function unwrap(v: unknown): unknown {
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return o.value ?? o.objective ?? o.subjective ?? v;
  }
  return v;
}

function toBool(v: unknown): boolean | null {
  if (typeof v === 'boolean') return v;
  const s = String(v ?? '')
    .trim()
    .toLowerCase();
  if (['yes', 'true', 'haan', 'y'].includes(s)) return true;
  if (['no', 'false', 'nahi', 'n'].includes(s)) return false;
  return null;
}

function toText(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}
