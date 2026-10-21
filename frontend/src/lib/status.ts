import type { Call, Driver } from './types'
import { inShift } from './time'

export type StateKind = 'needs-call' | 'calling' | 'missed' | 'tired' | 'awake' | 'quiet'
export type QuietReason = 'paused' | 'off-shift' | 'waiting'

export interface DriverState {
  kind: StateKind
  quiet?: QuietReason
  /** The check-in the state is based on, if any. */
  lastCheckIn?: Call
}

const MIN = 60_000
/** A check-in older than this no longer describes the driver right now. */
const FRESH_FOR = 90 * MIN
/** An unfinished call older than this is treated as stuck, not live. */
const LIVE_FOR = 5 * MIN

export const checkIns = (calls: Call[]) => calls.filter((c) => c.kind === 'CHECK_IN')

export const isLive = (c: Call, now = Date.now()) =>
  !c.completedAt && c.kind !== 'OWNER_ALERT' && now - new Date(c.createdAt).getTime() < LIVE_FOR

/** One rule for every screen, so the list, the detail page and the summary always agree. */
export function deriveState(d: Driver, now = new Date()): DriverState {
  const t = now.getTime()
  const ci = checkIns(d.calls)
  const lastCheckIn = ci.find((c) => c.completedAt && c.level)

  if (d.calls.some((c) => isLive(c, t))) return { kind: 'calling', lastCheckIn }
  if (!d.active) return { kind: 'quiet', quiet: 'paused', lastCheckIn }

  const fresh = d.lastCallAt && t - new Date(d.lastCallAt).getTime() < FRESH_FOR
  if (fresh && d.lastLevel) {
    const recentAlert = d.lastAlertAt && t - new Date(d.lastAlertAt).getTime() < 30 * MIN
    const finished = ci.filter((c) => c.completedAt)
    const missedTwice = finished.length >= 2 && finished[0].level === 'MISSED' && finished[1].level === 'MISSED'
    if (d.lastLevel === 'RED' || missedTwice || recentAlert) return { kind: 'needs-call', lastCheckIn }
    if (d.lastLevel === 'MISSED') return { kind: 'missed', lastCheckIn }
    if (d.lastLevel === 'AMBER') return { kind: 'tired', lastCheckIn }
    return { kind: 'awake', lastCheckIn }
  }

  return {
    kind: 'quiet',
    quiet: inShift(d.shiftStart, d.shiftEnd, now) ? 'waiting' : 'off-shift',
    lastCheckIn,
  }
}

const ORDER: StateKind[] = ['needs-call', 'calling', 'missed', 'tired', 'awake', 'quiet']

export function sortByAttention(drivers: Driver[], now = new Date()) {
  return drivers
    .map((d) => ({ d, s: deriveState(d, now) }))
    .sort((a, b) => {
      const byState = ORDER.indexOf(a.s.kind) - ORDER.indexOf(b.s.kind)
      if (byState) return byState
      // Within a group, whoever we heard from longest ago comes first.
      return (a.d.lastCallAt ?? '').localeCompare(b.d.lastCallAt ?? '') || a.d.name.localeCompare(b.d.name)
    })
}

/** Did the backend pull the next call forward because of a worrying check-in? */
export const calledSooner = (d: Driver) => d.lastLevel === 'AMBER' || d.lastLevel === 'RED' || d.lastLevel === 'MISSED'
