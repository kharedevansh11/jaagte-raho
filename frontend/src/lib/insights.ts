// Numbers and series for the dashboard cards and charts, derived from the calls we already load.
import type { Call, Driver, Level } from './types'
import { deriveState } from './status'

const HOUR = 3600_000
/** "Tonight" = the last 12 hours; long enough for any night shift, short enough to drop last night. */
const WINDOW = 12 * HOUR

export const recentCheckIns = (calls: Call[], now: Date) =>
  calls.filter(
    (c) => c.kind === 'CHECK_IN' && c.level && c.completedAt && now.getTime() - new Date(c.createdAt).getTime() < WINDOW,
  )

export interface HourBucket {
  start: Date
  counts: Record<Level, number>
  avgScore: number | null
}

/** Check-ins grouped by clock hour over the last `hours` hours, oldest first. */
export function hourly(drivers: Driver[], now: Date, hours = 8): HourBucket[] {
  const top = new Date(now)
  top.setMinutes(0, 0, 0)
  const buckets: HourBucket[] = Array.from({ length: hours }, (_, i) => ({
    start: new Date(top.getTime() - (hours - 1 - i) * HOUR),
    counts: { GREEN: 0, AMBER: 0, RED: 0, MISSED: 0 },
    avgScore: null,
  }))
  const scores: number[][] = buckets.map(() => [])
  for (const c of drivers.flatMap((d) => recentCheckIns(d.calls, now))) {
    const i = Math.floor((new Date(c.createdAt).getTime() - buckets[0].start.getTime()) / HOUR)
    if (i < 0 || i >= hours) continue
    buckets[i].counts[c.level!]++
    if (c.level !== 'MISSED' && c.score !== null) scores[i].push(c.score)
  }
  buckets.forEach((b, i) => {
    b.avgScore = scores[i].length ? Math.round(scores[i].reduce((a, s) => a + s, 0) / scores[i].length) : null
  })
  return buckets
}

export function fleetStats(drivers: Driver[], now: Date) {
  const states = drivers.map((d) => deriveState(d, now))
  const checkIns = drivers.flatMap((d) => recentCheckIns(d.calls, now))
  const answered = checkIns.filter((c) => c.level !== 'MISSED' && c.score !== null)
  return {
    total: drivers.length,
    onShift: states.filter((s) => s.kind !== 'quiet').length,
    needCall: states.filter((s) => s.kind === 'needs-call').length,
    checkIns: checkIns.length,
    missed: checkIns.filter((c) => c.level === 'MISSED').length,
    avgScore: answered.length ? Math.round(answered.reduce((a, c) => a + c.score!, 0) / answered.length) : null,
    alerts: drivers.flatMap((d) => d.calls).filter((c) => c.kind === 'OWNER_ALERT' && now.getTime() - new Date(c.createdAt).getTime() < WINDOW).length,
  }
}

/** Every call across the fleet, newest first, tagged with its driver. */
export const activity = (drivers: Driver[], limit = 8) =>
  drivers
    .flatMap((d) => d.calls.map((c) => ({ c, d })))
    .sort((a, b) => b.c.createdAt.localeCompare(a.c.createdAt))
    .slice(0, limit)
