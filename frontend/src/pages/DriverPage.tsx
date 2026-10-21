import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { AlertCircle, CalendarClock, ChevronLeft, Gauge, Hand, MapPin, Pause, Pencil, Phone, PhoneCall, PhoneOutgoing, Play, UserRound, Users } from 'lucide-react'
import { ApiError, AuthError } from '../lib/errors'
import type { Call, Driver } from '../lib/types'
import { useDriver } from '../hooks/useDriver'
import { useDriverCalls } from '../hooks/useDriverCalls'
import { useCallDriverNow, useUpdateDriver } from '../hooks/useDriverMutations'
import { calledSooner, checkIns, deriveState, isLive } from '../lib/status'
import { ji, languageName } from '../lib/strings'
import { hhmmLabel, inShift, nightKey, nightLabel, timeOf } from '../lib/time'
import { useNow } from '../lib/useNow'
import { recentCheckIns, type HourBucket } from '../lib/insights'
import { useLang, useToast } from '../app/providers'
import { Avatar, Shell } from '../components/Shell'
import { ScoreChart } from '../components/Charts'
import { StatusGlyph } from '../components/StatusGlyph'
import { Transcript } from '../components/Transcript'
import { ScoreBadge, StatusPill } from './Dashboard'

export function DriverPage() {
  const { id = '' } = useParams()
  const { t } = useLang()
  const now = useNow()
  const driver = useDriver(id)

  if (driver.error instanceof AuthError) return <Navigate to="/login" replace />

  const back = (
    <Link to="/" className="back-link">
      <ChevronLeft size={18} aria-hidden /> {t.back}
    </Link>
  )

  if (driver.error instanceof ApiError && driver.error.status === 404)
    return (
      <Shell title={t.error.notFound} back={back}>
        <Link to="/" className="btn">
          {t.back}
        </Link>
      </Shell>
    )

  const d = driver.data
  if (!d)
    return (
      <Shell title="" back={back}>
        <div className="skeleton">
          <div className="stats">
            <div className="sk sk-card" />
            <div className="sk sk-card" />
            <div className="sk sk-card" />
          </div>
          <div className="sk sk-chart" />
        </div>
      </Shell>
    )
  return <DriverView d={d} now={now} back={back} />
}

function DriverView({ d, now, back }: { d: Driver; now: Date; back: React.ReactNode }) {
  const { t } = useLang()
  const toast = useToast()
  const s = deriveState(d, now)
  const [confirmRing, setConfirmRing] = useState(false)
  const callNow = useCallDriverNow()
  const update = useUpdateDriver()
  const ringing = callNow.isPending
  const name = ji(d.name)
  const last = s.lastCheckIn
  const tonight = recentCheckIns(d.calls, now)
  const series: HourBucket[] = checkIns(d.calls)
    .filter((c) => c.completedAt && c.level && c.level !== 'MISSED' && c.score !== null)
    .slice(0, 10)
    .reverse()
    .map((c) => ({ start: new Date(c.createdAt), counts: { GREEN: 0, AMBER: 0, RED: 0, MISSED: 0 }, avgScore: c.score }))

  function ring() {
    setConfirmRing(false)
    callNow.mutate(d.id, {
      onSuccess: () => toast({ message: t.rang(name) }),
      onError: () => toast({ message: t.ringFailed }),
    })
  }

  function setActive(active: boolean) {
    update.mutate(
      { id: d.id, input: { active } },
      {
        onSuccess: () =>
          toast(active ? { message: t.resumed } : { message: t.paused(name), action: { label: t.undo, run: () => setActive(true) } }),
        onError: () => toast({ message: t.error.generic }),
      },
    )
  }

  const nextLine = !d.active
    ? t.quiet.paused
    : inShift(d.shiftStart, d.shiftEnd, now)
      ? d.nextCallAt && new Date(d.nextCallAt) > now
        ? timeOf(d.nextCallAt)
        : '–'
      : hhmmLabel(d.shiftStart)

  return (
    <Shell
      back={back}
      title={
        <span className="title-with-avatar">
          <Avatar name={d.name} size={44} />
          {d.name}
        </span>
      }
      subtitle={
        <span className="subtitle-row">
          <StatusPill d={d} s={s} />
          <span lang={d.language}>{languageName(d.language)}</span>
          <span>{t.shift(hhmmLabel(d.shiftStart), hhmmLabel(d.shiftEnd))}</span>
        </span>
      }
      actions={
        <>
          <a className={`btn ${s.kind === 'needs-call' ? 'btn-alert' : 'btn-primary'}`} href={`tel:${d.phone}`}>
            <Phone size={18} aria-hidden /> {t.call(name)}
          </a>
          <button className="btn" onClick={() => setConfirmRing(true)} disabled={ringing || s.kind === 'calling'}>
            <PhoneOutgoing size={17} aria-hidden /> {ringing ? t.ringing(name) : t.ringNow}
          </button>
          <button className="btn" onClick={() => setActive(!d.active)}>
            {d.active ? <Pause size={17} aria-hidden /> : <Play size={17} aria-hidden />}
            {d.active ? t.pause : t.resume}
          </button>
          <Link to={`/drivers/${d.id}/edit`} className="btn">
            <Pencil size={16} aria-hidden /> {t.edit}
          </Link>
        </>
      }
    >
      {confirmRing && (
        <div className="confirm-bar" role="alertdialog" aria-label={t.ringConfirm(name)}>
          <p>{t.ringConfirm(name)}</p>
          <div className="confirm-btns">
            <button className="btn btn-small" onClick={() => setConfirmRing(false)}>
              {t.form.keep}
            </button>
            <button className="btn btn-small btn-primary" onClick={ring} autoFocus>
              {t.ringNow}
            </button>
          </div>
        </div>
      )}

      <section className="stats stats-3">
        <div className="card stat">
          <span className="stat-icon tone-primary">
            <Gauge size={20} />
          </span>
          <p className="stat-label">{t.detail.lastScore}</p>
          <p className="stat-value">{last && last.level !== 'MISSED' ? (last.score ?? '–') : '–'}</p>
          <p className="stat-hint">{last?.level ? t.verdict[last.level] : t.stats.noData}</p>
        </div>
        <div className="card stat">
          <span className="stat-icon tone-sky">
            <PhoneCall size={20} />
          </span>
          <p className="stat-label">{t.stats.checkIns}</p>
          <p className="stat-value">{tonight.length}</p>
          <p className="stat-hint">{tonight.length ? t.stats.missed(tonight.filter((c) => c.level === 'MISSED').length) : t.stats.noData}</p>
        </div>
        <div className="card stat">
          <span className="stat-icon tone-tired">
            <CalendarClock size={20} />
          </span>
          <p className="stat-label">{t.table.next}</p>
          <p className="stat-value stat-value-sm">{nextLine}</p>
          <p className="stat-hint">{d.active && calledSooner(d) && inShift(d.shiftStart, d.shiftEnd, now) ? t.sooner : t.shift(hhmmLabel(d.shiftStart), hhmmLabel(d.shiftEnd))}</p>
        </div>
      </section>

      <section className="grid-detail">
        <div className="card verdict-card">
          <div className="card-head">
            <h2>{t.detail.lastCall}</h2>
            {last && last.level !== 'MISSED' && last.score !== null && <ScoreBadge score={last.score} />}
          </div>
          {last && last.level ? (
            <>
              <p className={`verdict-word tone-text-${last.level}`}>
                <StatusGlyph state={last.level} size={16} />
                {t.verdict[last.level]}
              </p>
              <p className="muted">{timeOf(last.createdAt)}</p>
              {last.reasons.length > 0 && (
                <ul className="reason-chips">
                  {last.reasons.map((r) => (
                    <li key={r}>{t.reason[r] ?? r}</li>
                  ))}
                </ul>
              )}
              {last.location && last.location !== 'unknown' && (
                <p className="verdict-meta">
                  <MapPin size={15} aria-hidden /> {last.location}
                </p>
              )}
            </>
          ) : (
            <p className="muted">{t.noCalls(name)}</p>
          )}
          <div className="manager-row">
            <span className="stat-icon tone-muted small">
              <UserRound size={16} />
            </span>
            {d.ownerPhone ? (
              <p>{t.manager(d.ownerName ? ji(d.ownerName) : d.ownerPhone)}</p>
            ) : (
              <p className="warn">
                {t.noManager(name)} <Link to={`/drivers/${d.id}/edit`}>{t.addManager}</Link>
              </p>
            )}
          </div>
        </div>
        <div className="card">
          <div className="card-head">
            <div>
              <h2>{t.detail.trend}</h2>
              <p className="card-sub">{t.detail.trendSub}</p>
            </div>
          </div>
          <ScoreChart buckets={series} empty={t.charts.empty} />
        </div>
      </section>

      <section className="card timeline" aria-label={t.timeline}>
        <div className="card-head">
          <h2>{t.timeline}</h2>
        </div>
        <Timeline d={d} now={now} />
      </section>
    </Shell>
  )
}

/** The full call history, 20 at a time, grouped by night. */
function Timeline({ d, now }: { d: Driver; now: Date }) {
  const { t } = useLang()
  const history = useDriverCalls(d.id)
  if (history.isPending) return <div className="sk sk-row" aria-hidden />
  if (history.calls.length === 0) return <p className="muted">{t.noCalls(ji(d.name))}</p>

  const groups = new Map<string, Call[]>()
  for (const c of history.calls) {
    const k = nightKey(c.createdAt)
    groups.set(k, [...(groups.get(k) ?? []), c])
  }
  const tonight = nightKey(now)
  const lastNight = nightKey(new Date(now.getTime() - 24 * 3600_000))

  return (
    <>
      {[...groups.entries()].map(([k, calls]) => (
        <div key={k} className="night">
          <h3>{k === tonight ? t.tonight : k === lastNight ? t.lastNight : nightLabel(k)}</h3>
          <ol>
            {calls.map((c) => (
              <Entry key={c.id} c={c} d={d} />
            ))}
          </ol>
        </div>
      ))}
      {history.hasNextPage && (
        <button className="btn btn-small load-more" onClick={() => history.fetchNextPage()} disabled={history.isFetchingNextPage}>
          {history.isFetchingNextPage ? t.loadingOlder : t.showOlder}
        </button>
      )}
    </>
  )
}

function Entry({ c, d }: { c: Call; d: Driver }) {
  const { t } = useLang()
  const [open, setOpen] = useState(false)
  const time = timeOf(c.createdAt)
  const manager = d.ownerName ? ji(d.ownerName) : t.form.manager

  if (isLive(c))
    return (
      <li className="entry live-entry">
        <StatusGlyph state="calling" size={12} />
        <span className="entry-time">{time}</span>
        <span>{t.callingNow}</span>
      </li>
    )

  if (c.kind === 'OWNER_ALERT')
    return (
      <li className="entry entry-alert">
        <PhoneCall size={15} aria-hidden />
        <span className="entry-time">{time}</span>
        <span>
          {t.alertCall(manager)}
          {c.completedAt && <span className="muted">, {c.status === 'completed' ? t.alertPicked : t.alertMissed}</span>}
        </span>
      </li>
    )

  if (c.kind === 'WELCOME')
    return (
      <li className="entry entry-quiet">
        <Hand size={15} aria-hidden />
        <span className="entry-time">{time}</span>
        <span>
          {t.welcomeCall}
          {c.completedAt && c.status !== 'completed' && <span>, {t.notThrough}</span>}
        </span>
      </li>
    )

  if (!c.level)
    return (
      <li className="entry entry-quiet">
        <AlertCircle size={15} aria-hidden />
        <span className="entry-time">{time}</span>
        <span>{t.failedCall}</span>
      </li>
    )

  const hasMore = !!(c.transcript || c.summary || c.reasons.length)
  return (
    <li className={`entry entry-checkin${open ? ' open' : ''}`}>
      <button className="entry-head" onClick={() => hasMore && setOpen((o) => !o)} aria-expanded={hasMore ? open : undefined}>
        <StatusGlyph state={c.level} size={12} />
        <span className="entry-time">{time}</span>
        <span className="entry-main">
          {t.verdict[c.level]}
          {c.location && c.location !== 'unknown' && <span className="muted">, {c.location}</span>}
        </span>
        {c.passenger && <Users size={15} aria-label={t.passenger} />}
      </button>
      {open && (
        <div className="entry-body">
          {c.reasons.length > 0 && (
            <ul className="reason-chips">
              {c.reasons.map((r) => (
                <li key={r}>{t.reason[r] ?? r}</li>
              ))}
            </ul>
          )}
          {c.summary && <p className="entry-summary">{c.summary}</p>}
          {c.transcript && <Transcript text={c.transcript} agent={t.agentName} person={d.name.split(' ')[0]} />}
        </div>
      )}
    </li>
  )
}
