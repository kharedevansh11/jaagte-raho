import { Link, Navigate } from 'react-router-dom'
import { Activity, ChevronRight, Gauge, Phone, PhoneCall, Plus, Siren, Users } from 'lucide-react'
import { ApiError, AuthError } from '../lib/errors'
import type { Call, Driver } from '../lib/types'
import { useDrivers } from '../hooks/useDrivers'
import { sortByAttention, type DriverState } from '../lib/status'
import { activity, fleetStats, hourly } from '../lib/insights'
import { ji, languageName, type Strings } from '../lib/strings'
import { ago, hhmmLabel, timeOf } from '../lib/time'
import { useNow } from '../lib/useNow'
import { useLang } from '../app/providers'
import { Avatar, Shell } from '../components/Shell'
import { OutcomeBars, ScoreChart, Sparkline } from '../components/Charts'
import { StatusGlyph } from '../components/StatusGlyph'

const dayFmt = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long' })

export function Dashboard() {
  const { t } = useLang()
  const now = useNow()
  const fleet = useDrivers()

  if (fleet.error instanceof AuthError) return <Navigate to="/login" replace />

  const drivers = fleet.data
  // isError only flips after the quiet retries are used up, so a single blip never shows a banner.
  const updatedAt = fleet.dataUpdatedAt ? new Date(fleet.dataUpdatedAt) : undefined
  const stale = updatedAt && (fleet.isError || now.getTime() - updatedAt.getTime() > 2 * 60_000)

  return (
    <Shell
      title={t.nav.overview}
      subtitle={t.overviewSub(dayFmt.format(now))}
      actions={
        <Link to="/drivers/new" className="btn btn-primary hide-mobile">
          <Plus size={18} aria-hidden /> {t.addDriver}
        </Link>
      }
    >
      {stale && <p className="stale-bar">{t.stale(timeOf(updatedAt))}</p>}
      {!drivers ? (
        fleet.isError ? (
          <p className="stale-bar">
            {fleet.error instanceof ApiError && fleet.error.status === 403 ? t.error.rejected : t.error.network}
          </p>
        ) : <Skeleton />
      ) : drivers.length === 0 ? (
        <Empty t={t} />
      ) : (
        <Overview drivers={drivers} now={now} />
      )}
      {updatedAt && <p className="updated">{t.updated(timeOf(updatedAt))}</p>}

      {drivers && drivers.length > 0 && (
        <div className="dock">
          <Link to="/drivers/new" className="btn btn-primary dock-btn">
            <Plus size={18} aria-hidden /> {t.addDriver}
          </Link>
        </div>
      )}
    </Shell>
  )
}

function Overview({ drivers, now }: { drivers: Driver[]; now: Date }) {
  const { t } = useLang()
  const stats = fleetStats(drivers, now)
  const buckets = hourly(drivers, now)
  const sorted = sortByAttention(drivers, now)
  const needs = sorted.filter((x) => x.s.kind === 'needs-call')

  return (
    <>
      {needs.length > 0 && <AlertBanner items={needs} />}

      <section className="stats">
        <Stat icon={<Users size={20} />} tone="primary" label={t.stats.onShift} value={stats.onShift} hint={t.stats.ofTotal(stats.total)} />
        <Stat
          icon={<Siren size={20} />}
          tone={stats.needCall ? 'alert' : 'awake'}
          label={t.stats.needCall}
          value={stats.needCall}
          hint={stats.needCall ? t.stats.needCallSome : t.stats.needCallNone}
        />
        <Stat
          icon={<Activity size={20} />}
          tone="sky"
          label={t.stats.checkIns}
          value={stats.checkIns}
          hint={stats.checkIns ? t.stats.missed(stats.missed) : t.stats.noData}
          spark={buckets.map((b) => b.counts.GREEN + b.counts.AMBER + b.counts.RED + b.counts.MISSED)}
        />
        <Stat
          icon={<Gauge size={20} />}
          tone="tired"
          label={t.stats.avgScore}
          value={stats.avgScore ?? '–'}
          hint={stats.avgScore === null ? t.stats.noData : t.stats.avgHint}
          spark={buckets.map((b) => b.avgScore).filter((v): v is number => v !== null)}
        />
      </section>

      <section className="grid-charts">
        <div className="card">
          <div className="card-head">
            <div>
              <h2>{t.charts.score}</h2>
              <p className="card-sub">{t.charts.scoreSub}</p>
            </div>
          </div>
          <ScoreChart buckets={buckets} empty={t.charts.empty} />
        </div>
        <div className="card">
          <div className="card-head">
            <div>
              <h2>{t.charts.outcomes}</h2>
              <p className="card-sub">{t.charts.outcomesSub}</p>
            </div>
          </div>
          <OutcomeBars
            buckets={buckets}
            empty={t.charts.empty}
            labels={{ GREEN: t.state.awake, AMBER: t.state.tired, RED: t.state['needs-call'], MISSED: t.state.missed }}
          />
          <ul className="legend">
            <li>
              <i className="dot dot-GREEN" /> {t.state.awake}
            </li>
            <li>
              <i className="dot dot-AMBER" /> {t.state.tired}
            </li>
            <li>
              <i className="dot dot-RED" /> {t.state['needs-call']}
            </li>
            <li>
              <i className="dot dot-MISSED" /> {t.state.missed}
            </li>
          </ul>
        </div>
      </section>

      <section className="grid-bottom">
        <div className="card card-flush">
          <div className="card-head padded">
            <div>
              <h2>{t.table.title}</h2>
              <p className="card-sub">{t.table.sub}</p>
            </div>
          </div>
          <DriverTable rows={sorted} now={now} />
        </div>
        <div className="card">
          <div className="card-head">
            <h2>{t.activityTitle}</h2>
          </div>
          <Feed drivers={drivers} now={now} />
        </div>
      </section>
    </>
  )
}

function AlertBanner({ items }: { items: { d: Driver; s: DriverState }[] }) {
  const { t } = useLang()
  const { d, s } = items[0]
  const c = s.lastCheckIn
  const detail = [c?.level ? `${t.verdict[c.level]}, ${timeOf(c.createdAt)}` : undefined, c?.location && c.location !== 'unknown' ? c.location : undefined]
    .filter(Boolean)
    .join(', ')
  return (
    <section className="alert-banner" role="alert">
      <span className="alert-icon">
        <Siren size={22} aria-hidden />
      </span>
      <div className="alert-text">
        <h2>{items.length === 1 ? t.summary.oneNeedsCall(ji(d.name)) : t.summary.manyNeedCall(items.length)}</h2>
        {items.length === 1 && (
          <p>
            {detail}
            {d.lastAlertAt && d.ownerName ? `. ${t.summary.managerCalled(ji(d.ownerName))}` : ''}
          </p>
        )}
      </div>
      {items.length === 1 && (
        <a className="btn btn-alert" href={`tel:${d.phone}`}>
          <Phone size={18} aria-hidden /> {t.call(ji(d.name))}
        </a>
      )}
    </section>
  )
}

function Stat(props: { icon: React.ReactNode; tone: string; label: string; value: number | string; hint: string; spark?: number[] }) {
  return (
    <div className="card stat">
      <div className="stat-top">
        <span className={`stat-icon tone-${props.tone}`}>{props.icon}</span>
        {props.spark && props.spark.length > 1 && <Sparkline values={props.spark} tone={props.tone} />}
      </div>
      <p className="stat-label">{props.label}</p>
      <p className="stat-value">{props.value}</p>
      <p className={`stat-hint tone-text-${props.tone}`}>{props.hint}</p>
    </div>
  )
}

export function statusWord(t: Strings, d: Driver, s: DriverState) {
  if (s.kind !== 'quiet') return t.state[s.kind]
  if (s.quiet === 'paused') return t.quiet.paused
  if (s.quiet === 'off-shift') return t.quiet.offShift(hhmmLabel(d.shiftStart))
  return d.nextCallAt ? t.quiet.waiting(timeOf(d.nextCallAt)) : t.quiet.waitingSoon
}

export function StatusPill({ d, s }: { d: Driver; s: DriverState }) {
  const { t } = useLang()
  return (
    <span className={`pill pill-${s.kind}`}>
      <StatusGlyph state={s.kind} size={9} />
      {statusWord(t, d, s)}
    </span>
  )
}

export function ScoreBadge({ score }: { score: number }) {
  const tone = score >= 80 ? 'good' : score >= 45 ? 'warn' : 'bad'
  return <span className={`score-badge score-${tone}`}>{score}</span>
}

function DriverTable({ rows, now }: { rows: { d: Driver; s: DriverState }[]; now: Date }) {
  const { t, lang } = useLang()
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>{t.table.driver}</th>
            <th>{t.table.status}</th>
            <th>{t.table.lastCall}</th>
            <th className="num-col">{t.table.score}</th>
            <th>{t.table.next}</th>
            <th aria-label={t.table.view} />
          </tr>
        </thead>
        <tbody>
          {rows.map(({ d, s }) => {
            const c = s.lastCheckIn
            const where = c?.location && c.location !== 'unknown' ? c.location : null
            const history = d.calls.filter((x) => x.kind === 'CHECK_IN' && x.level).slice(0, 8).reverse()
            return (
              <tr key={d.id} className={`tr-${s.kind}`}>
                <td className="cell-first">
                  <Link to={`/drivers/${d.id}`} className="cell-driver">
                    <Avatar name={d.name} size={38} />
                    <span>
                      <span className="cell-name">{d.name}</span>
                      <span className="cell-sub" lang={d.language}>
                        {languageName(d.language)}
                      </span>
                    </span>
                  </Link>
                </td>
                <td data-label={t.table.status}>
                  <span className="cell-status">
                    <StatusPill d={d} s={s} />
                    {history.length > 0 && (
                      <span className="history" aria-hidden>
                        {history.map((h) => (
                          <StatusGlyph key={h.id} state={h.level!} size={7} />
                        ))}
                      </span>
                    )}
                  </span>
                </td>
                <td data-label={t.table.lastCall}>
                  {c ? (
                    <span className="cell-stack">
                      <span>{ago(c.createdAt, lang, now.getTime())}</span>
                      {where && <span className="cell-sub truncate">{where}</span>}
                    </span>
                  ) : (
                    <span className="muted">–</span>
                  )}
                </td>
                <td data-label={t.table.score} className="num-col">
                  {c && c.level !== 'MISSED' && c.score !== null ? <ScoreBadge score={c.score} /> : <span className="muted">–</span>}
                </td>
                <td data-label={t.table.next}>
                  {d.active && s.kind !== 'quiet' && d.nextCallAt ? timeOf(d.nextCallAt) : <span className="muted">–</span>}
                </td>
                <td className="cell-actions">
                  {s.kind === 'needs-call' && (
                    <a className="icon-btn icon-btn-alert" href={`tel:${d.phone}`} aria-label={t.call(ji(d.name))}>
                      <Phone size={17} />
                    </a>
                  )}
                  <Link to={`/drivers/${d.id}`} className="icon-btn" aria-label={t.table.view}>
                    <ChevronRight size={18} />
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function activityLine(t: Strings, c: Call, d: Driver) {
  const name = ji(d.name)
  if (c.kind === 'OWNER_ALERT') return { tone: 'info', text: `${t.alertCall(d.ownerName ? ji(d.ownerName) : t.form.manager)}: ${name}` }
  if (c.kind === 'WELCOME') return { tone: 'muted', text: `${t.welcomeCall}: ${name}` }
  if (!c.completedAt) return { tone: 'info', text: `${t.callingNow} ${name}` }
  if (!c.level) return { tone: 'muted', text: `${t.verdict.failed}: ${name}` }
  return { tone: c.level, text: `${name}: ${t.verdict[c.level].toLowerCase()}` }
}

function Feed({ drivers, now }: { drivers: Driver[]; now: Date }) {
  const { t, lang } = useLang()
  const items = activity(drivers)
  if (!items.length) return <p className="muted">{t.activityEmpty}</p>
  return (
    <ol className="feed">
      {items.map(({ c, d }) => {
        const line = activityLine(t, c, d)
        return (
          <li key={c.id}>
            <span className={`feed-icon feed-${line.tone}`}>
              {c.kind === 'OWNER_ALERT' ? <PhoneCall size={14} /> : <StatusGlyph state={c.level ?? 'none'} size={9} />}
            </span>
            <Link to={`/drivers/${d.id}`} className="feed-text">
              {line.text}
            </Link>
            <span className="feed-time">{ago(c.createdAt, lang, now.getTime())}</span>
          </li>
        )
      })}
    </ol>
  )
}

function Skeleton() {
  return (
    <div aria-hidden className="skeleton">
      <div className="stats">
        <div className="sk sk-card" />
        <div className="sk sk-card" />
        <div className="sk sk-card" />
        <div className="sk sk-card" />
      </div>
      <div className="sk sk-chart" />
    </div>
  )
}

function Empty({ t }: { t: Strings }) {
  return (
    <section className="card empty">
      <span className="stat-icon tone-primary">
        <Users size={22} />
      </span>
      <h2>{t.empty.title}</h2>
      <p>{t.empty.body}</p>
      <Link to="/drivers/new" className="btn btn-primary">
        <Plus size={18} aria-hidden /> {t.empty.cta}
      </Link>
    </section>
  )
}
