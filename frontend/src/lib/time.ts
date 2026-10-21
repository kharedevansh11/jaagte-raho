// Shift hours are stored as IST "HH:mm", so every clock in the app is shown in IST.
const TZ = 'Asia/Kolkata'

const clock = new Intl.DateTimeFormat('en-IN', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true })
const dayFmt = new Intl.DateTimeFormat('en-IN', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short' })

/** "2:14 am" */
export const timeOf = (d: Date | string) => clock.format(new Date(d)).replace(/\s?([ap])\.?m\.?/i, ' $1m').toLowerCase()

/** "10 pm" for "22:00", "10:30 pm" for "22:30" */
export function hhmmLabel(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  const suffix = h < 12 ? 'am' : 'pm'
  const h12 = h % 12 || 12
  return m ? `${h12}:${String(m).padStart(2, '0')} ${suffix}` : `${h12} ${suffix}`
}

export function minutesInIST(d = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d)
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value)
  return get('hour') * 60 + get('minute')
}

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** Same rule as the backend: an end at or before the start wraps past midnight. */
export function inShift(start: string, end: string, now = new Date()) {
  const n = minutesInIST(now)
  const s = toMinutes(start)
  const e = toMinutes(end)
  return s < e ? n >= s && n < e : n >= s || n < e
}

/** Length of a shift in minutes, across midnight if needed. */
export function shiftLength(start: string, end: string) {
  const diff = toMinutes(end) - toMinutes(start)
  return diff <= 0 ? diff + 24 * 60 : diff
}

/** 0..1 position of `now` inside the shift, or null outside it. */
export function shiftProgress(start: string, end: string, at: Date) {
  if (!inShift(start, end, at)) return null
  const elapsed = (minutesInIST(at) - toMinutes(start) + 24 * 60) % (24 * 60)
  return elapsed / shiftLength(start, end)
}

export function ago(d: string | Date, lang: 'en' | 'hi', now = Date.now()) {
  const m = Math.round((now - new Date(d).getTime()) / 60_000)
  if (lang === 'hi') {
    if (m < 1) return 'अभी'
    if (m < 60) return `${m} मिनट पहले`
    const h = Math.round(m / 60)
    return h < 24 ? `${h} घंटे पहले` : dayFmt.format(new Date(d))
  }
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  return h < 24 ? `${h} h ago` : dayFmt.format(new Date(d))
}

/**
 * The night a call belongs to: a 1 am call is part of the previous evening's night.
 * Returns a sortable key ("2026-10-16") for grouping.
 */
export function nightKey(d: string | Date) {
  const shifted = new Date(new Date(d).getTime() - 12 * 3600_000)
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(shifted)
}

export const nightLabel = (key: string) => dayFmt.format(new Date(`${key}T12:00:00+05:30`))
