// Small hand-rolled SVG charts: enough for a few series, no chart library.
import type { HourBucket } from '../lib/insights'
import { timeOf } from '../lib/time'

export function Sparkline({ values, tone = 'primary' }: { values: number[]; tone?: string }) {
  const w = 96
  const h = 36
  if (values.length < 2) return <svg width={w} height={h} aria-hidden />
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 4 - ((v - min) / (max - min || 1)) * (h - 8)])
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={`spark tone-${tone}`} aria-hidden>
      <path d={`${d} L${w} ${h} L0 ${h} Z`} className="spark-fill" />
      <path d={d} className="spark-line" />
    </svg>
  )
}

const hourLabel = (d: Date) => timeOf(d).replace(':00', '')

/** Average alertness score per hour, 0–100, with the 80 / 45 level lines drawn in. */
export function ScoreChart({ buckets, empty }: { buckets: HourBucket[]; empty: string }) {
  const W = 560
  const H = 220
  const pad = { l: 34, r: 26, t: 12, b: 28 }
  const iw = W - pad.l - pad.r
  const ih = H - pad.t - pad.b
  const x = (i: number) => pad.l + (buckets.length === 1 ? iw / 2 : (i / (buckets.length - 1)) * iw)
  const y = (v: number) => pad.t + ih - (v / 100) * ih
  const pts = buckets.map((b, i) => (b.avgScore === null ? null : ([x(i), y(b.avgScore), b.avgScore] as const)))
  const known = pts.filter((p): p is readonly [number, number, number] => !!p)

  // Break the line where an hour has no answered calls.
  let d = ''
  pts.forEach((p, i) => {
    if (!p) return
    d += `${i === 0 || !pts[i - 1] ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)} `
  })

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Average alertness score by hour">
        <defs>
          <linearGradient id="score-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--primary)" stopOpacity="0.18" />
            <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} className="grid" />
            <text x={pad.l - 8} y={y(v) + 4} className="axis" textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        <line x1={pad.l} x2={W - pad.r} y1={y(80)} y2={y(80)} className="threshold threshold-good" />
        <line x1={pad.l} x2={W - pad.r} y1={y(45)} y2={y(45)} className="threshold threshold-bad" />
        {known.length > 1 && (
          <path d={`${d} L${known[known.length - 1][0]} ${y(0)} L${known[0][0]} ${y(0)} Z`} fill="url(#score-fill)" />
        )}
        <path d={d} className="score-line" />
        {known.map(([px, py, v], i) => (
          <circle key={i} cx={px} cy={py} r="4" className={`score-dot ${v >= 80 ? 'good' : v >= 45 ? 'warn' : 'bad'}`}>
            <title>{v}</title>
          </circle>
        ))}
        {buckets.map((b, i) => (
          <text key={i} x={x(i)} y={H - 8} className="axis" textAnchor="middle">
            {hourLabel(b.start)}
          </text>
        ))}
      </svg>
      {known.length === 0 && <p className="chart-empty">{empty}</p>}
    </div>
  )
}

const LEVELS = ['GREEN', 'AMBER', 'RED', 'MISSED'] as const

/** Check-in outcomes per hour as stacked bars. */
export function OutcomeBars({ buckets, labels, empty }: { buckets: HourBucket[]; labels: Record<(typeof LEVELS)[number], string>; empty: string }) {
  const W = 420
  const H = 220
  const pad = { l: 26, r: 14, t: 12, b: 28 }
  const iw = W - pad.l - pad.r
  const ih = H - pad.t - pad.b
  const totals = buckets.map((b) => LEVELS.reduce((a, l) => a + b.counts[l], 0))
  const max = Math.max(4, ...totals)
  const slot = iw / buckets.length
  const bw = Math.min(26, slot * 0.56)
  const y = (v: number) => pad.t + ih - (v / max) * ih

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Check-in results by hour">
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={pad.l} x2={W - pad.r} y1={y(max * f)} y2={y(max * f)} className="grid" />
            <text x={pad.l - 8} y={y(max * f) + 4} className="axis" textAnchor="end">
              {Math.round(max * f)}
            </text>
          </g>
        ))}
        {buckets.map((b, i) => {
          let acc = 0
          const cx = pad.l + slot * i + slot / 2
          return (
            <g key={i}>
              <rect x={cx - bw / 2} y={pad.t} width={bw} height={ih} rx="6" className="bar-track" />
              {LEVELS.map((l) => {
                const n = b.counts[l]
                if (!n) return null
                const top = y(acc + n)
                const h = y(acc) - top
                acc += n
                return (
                  <rect key={l} x={cx - bw / 2} y={top} width={bw} height={h} className={`bar bar-${l}`}>
                    <title>{`${n} ${labels[l]}`}</title>
                  </rect>
                )
              })}
              <text x={cx} y={H - 8} className="axis" textAnchor="middle">
                {hourLabel(b.start)}
              </text>
            </g>
          )
        })}
      </svg>
      {totals.every((t) => t === 0) && <p className="chart-empty">{empty}</p>}
    </div>
  )
}
