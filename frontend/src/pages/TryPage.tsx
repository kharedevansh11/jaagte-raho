import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../lib/errors'
import type { DemoResult } from '../lib/types'
import { useDemoResult, useStartDemoCall } from '../hooks/useDemo'
import { STRINGS, ji } from '../lib/strings'
import { LanguageChips, PhoneField } from '../components/Fields'
import { toE164 } from '../lib/phone'
import { StatusGlyph } from '../components/StatusGlyph'
import { Transcript } from '../components/Transcript'
import { ThemeToggle, Wordmark } from '../components/Header'

// The judge page is English-first: it's read once, by people scanning many projects.
const en = STRINGS.en

type Stage = { kind: 'form' } | { kind: 'live'; callId: string; startedAt: number; masked: string } | { kind: 'result'; result: DemoResult }

const STEPS = ['Call placed', 'Ringing', 'Talking', 'Listening back'] as const

function stepFor(status: string): number {
  if (status === 'ringing') return 1
  if (status === 'in-progress' || status === 'call-disconnected') return 2
  if (['completed', 'no-answer', 'busy', 'failed', 'canceled', 'stopped', 'error', 'balance-low', 'dial-failed'].includes(status)) return 3
  return 0
}

const NEXT: Record<string, string> = {
  GREEN: 'Next call in 20 minutes. Nobody else is disturbed.',
  AMBER: "We'd call back in 10 minutes to check again.",
  RED: "We'd phone your manager right away, and call you again in 10 minutes.",
  MISSED: "We'd try again in 10 minutes. Miss that one too, and your manager gets a call.",
}

const VERDICT_WORD = { GREEN: en.state.awake, AMBER: en.state.tired, RED: en.state['needs-call'], MISSED: en.state.missed }

function errorCopy(e: unknown) {
  if (!(e instanceof ApiError)) return en.error.generic
  if (e.message === 'network') return 'Couldn’t reach us. Check your connection and try again.'
  if (e.status === 400) return 'Enter the number with its country code, like +91 98765 43210.'
  if (e.status === 409) return 'This number belongs to a registered driver, so it can’t be used for the demo.'
  if (e.status === 429)
    return /today/i.test(e.message)
      ? 'The demo hit its call limit for today. Please try tomorrow.'
      : 'We already called this number in the last hour. Try another number, or come back a little later.'
  return 'Couldn’t place the call. Please try again.'
}

export function TryPage() {
  const [stage, setStage] = useState<Stage>({ kind: 'form' })
  const [name, setName] = useState('')
  const [prefix, setPrefix] = useState('+91')
  const [number, setNumber] = useState('')
  const [language, setLanguage] = useState('hi')
  const [error, setError] = useState<string>()
  const [phoneError, setPhoneError] = useState<string>()
  const startCall = useStartDemoCall()
  const busy = startCall.isPending

  const showResult = useCallback((result: DemoResult) => setStage({ kind: 'result', result }), [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(undefined)
    const phone = toE164(prefix, number)
    setPhoneError(phone ? undefined : 'Check the number. Indian mobiles have 10 digits.')
    if (!phone || !name.trim()) return
    try {
      const { callId } = await startCall.mutateAsync({ name: name.trim(), phone, language })
      setStage({ kind: 'live', callId, startedAt: Date.now(), masked: phone.replace(/(\+\d{2})(\d{2})\d+(\d{3})$/, '$1 $2••• ••$3') })
    } catch (err) {
      setError(errorCopy(err))
    }
  }

  return (
    <div className="try">
      <header className="try-top">
        <Wordmark />
        <span className="try-top-right">
          <ThemeToggle compact />
          <Link to="/login" className="quiet-link">
            For fleet owners
          </Link>
        </span>
      </header>

      <main className="try-main">
        <section className="try-intro">
          <h1>A caring voice that keeps night-shift drivers awake.</h1>
          <p>
            Every 20 to 30 minutes it phones the driver for a short chat in their own language, listens for
            sleepiness, and calls their manager if they need help.
          </p>
        </section>

        <section className="try-card" aria-live="polite">
          {stage.kind === 'form' && (
            <form onSubmit={submit} noValidate>
              <h2>Try it on your phone</h2>
              <div className="field">
                <label htmlFor="try-name">Your name</label>
                <input id="try-name" autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Priya" maxLength={40} required />
              </div>
              <PhoneField id="try-phone" label="Phone" prefix={prefix} number={number} onPrefix={setPrefix} onNumber={setNumber} error={phoneError} />
              <LanguageChips label="Language" value={language} onChange={setLanguage} only={['hi', 'en', 'ta', 'kn']} />
              {error && <p className="form-error">{error}</p>}
              <button className="btn btn-primary btn-block" disabled={busy || !name.trim() || !number.trim()}>
                {busy ? 'Placing the call…' : 'Call me now'}
              </button>
              <p className="fine">Takes under a minute. One call per number per hour. Your number is used only for this demo.</p>
            </form>
          )}

          {stage.kind === 'live' && (
            <LiveCall
              callId={stage.callId}
              masked={stage.masked}
              startedAt={stage.startedAt}
              onDone={showResult}
              onRestart={() => setStage({ kind: 'form' })}
            />
          )}

          {stage.kind === 'result' && <Result result={stage.result} name={name} onRestart={() => setStage({ kind: 'form' })} />}
        </section>

        <aside className="try-tip">
          <strong>Tip:</strong> answer like a tired driver. Go quiet, mumble, lose track. Watch what happens to the score.
        </aside>

        <section className="how">
          <h2>How it works</h2>
          <ol>
            <li>
              <StatusGlyph state="awake" size={14} />
              <div>
                <h3>We call every 20–30 minutes</h3>
                <p>During the night shift, in the driver’s language, like a friend checking in.</p>
              </div>
            </li>
            <li>
              <StatusGlyph state="tired" size={14} />
              <div>
                <h3>We listen</h3>
                <p>For silence, a sleepy voice and confused answers. A tired driver gets a gentle nudge to stop for chai.</p>
              </div>
            </li>
            <li>
              <StatusGlyph state="needs-call" size={14} />
              <div>
                <h3>We call the manager</h3>
                <p>If the driver sounds very sleepy or misses two calls, so someone who knows them can step in.</p>
              </div>
            </li>
          </ol>
        </section>
      </main>

      <footer className="try-foot">
        <span className="try-foot-brand">Jaagte Raho</span>
        <span>
          Powered by{' '}
          <a href="https://www.bolna.ai" target="_blank" rel="noopener noreferrer">
            Bolna AI
          </a>
        </span>
      </footer>
    </div>
  )
}

function LiveCall(props: { callId: string; masked: string; startedAt: number; onDone: (r: DemoResult) => void; onRestart: () => void }) {
  const { data, error, dataUpdatedAt } = useDemoResult(props.callId, props.startedAt)
  const { onDone } = props
  useEffect(() => {
    if (data?.completedAt) onDone(data)
  }, [data, onDone])

  const status = data?.status ?? 'queued'
  const slow = dataUpdatedAt - props.startedAt > 3 * 60_000
  if (error?.status === 404)
    return (
      <div className="live">
        <p>We lost track of that call.</p>
        <button className="btn" onClick={props.onRestart}>
          Start over
        </button>
      </div>
    )

  const step = stepFor(status)
  return (
    <div className="live">
      <div className="ring" aria-hidden>
        <span />
        <span />
        <svg viewBox="0 0 24 24" width="28" height="28">
          <path
            d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1Z"
            fill="currentColor"
          />
        </svg>
      </div>
      <h2>Calling {props.masked}</h2>
      <ol className="steps">
        {STEPS.map((s, i) => (
          <li key={s} className={i < step ? 'done' : i === step ? 'now' : ''}>
            {s}
          </li>
        ))}
      </ol>
      <p className="muted">Pick up and chat for a bit. Your result shows up here when you hang up.</p>
      {slow && (
        <p className="muted">
          Still waiting for the call to finish.{' '}
          <button className="link" onClick={props.onRestart}>
            Start over
          </button>
        </p>
      )}
    </div>
  )
}

function useCountUp(target: number | null) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (target === null) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return setN(target)
    const start = performance.now()
    let raf = 0
    const step = (t: number) => {
      const p = Math.min((t - start) / 800, 1)
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target])
  return n
}

function Result({ result, name, onRestart }: { result: DemoResult; name: string; onRestart: () => void }) {
  const [showTranscript, setShowTranscript] = useState(false)
  const shown = useCountUp(result.score)
  const level = result.level

  if (!level)
    return (
      <div className="result">
        <h2>Our call didn’t go through.</h2>
        <p className="muted">That’s on us, not you. Try again in a bit.</p>
        <button className="btn" onClick={onRestart}>
          Start over
        </button>
      </div>
    )

  const reasons = result.reasons.map((r) => en.reason[r] ?? r)
  return (
    <div className={`result tone-${level}`}>
      <div className="result-head">
        <StatusGlyph state={level} size={22} />
        <span className="result-word">{VERDICT_WORD[level]}</span>
        {result.score !== null && (
          <span className="result-score">
            {shown}
            <small>/100</small>
          </span>
        )}
      </div>
      <p className="result-line">
        {en.verdict[level]}.{' '}
        {level === 'RED' ? 'In real life, your manager would get a call now.' : level === 'GREEN' ? 'Your manager wouldn’t be disturbed.' : ''}
      </p>

      {reasons.length > 0 && (
        <div className="result-block">
          <h3>What we noticed</h3>
          <ul className="reason-chips">
            {reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="result-block">
        <h3>What happens next</h3>
        <p>{NEXT[level]}</p>
      </div>

      {result.transcript && (
        <div className="result-block">
          <button className="link" aria-expanded={showTranscript} onClick={() => setShowTranscript((s) => !s)}>
            {showTranscript ? 'Hide what was said' : 'Show what was said'}
          </button>
          {showTranscript && <Transcript text={result.transcript} agent="Jaagte Raho" person={name.trim() ? ji(name).replace(' ji', '') : 'You'} />}
        </div>
      )}

      <button className="btn btn-block" onClick={onRestart}>
        Try with another number
      </button>
    </div>
  )
}
