import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { X } from 'lucide-react'
import { ApiError, AuthError } from '../lib/errors'
import type { CreateDriverInput } from '../graphql/generated'
import type { Driver } from '../lib/types'
import { useDriver } from '../hooks/useDriver'
import { useCreateDriver, useDeleteDriver, useUpdateDriver } from '../hooks/useDriverMutations'
import { ji } from '../lib/strings'
import { hhmmLabel, shiftLength, toMinutes } from '../lib/time'
import { useLang, useToast } from '../app/providers'
import { LanguageChips, PhoneField } from '../components/Fields'
import { fromE164, toE164 } from '../lib/phone'

interface Form {
  name: string
  prefix: string
  number: string
  language: string
  shiftStart: string
  shiftEnd: string
  ownerName: string
  ownerPrefix: string
  ownerNumber: string
}

const blank: Form = {
  name: '',
  prefix: '+91',
  number: '',
  language: 'hi',
  shiftStart: '22:00',
  shiftEnd: '06:00',
  ownerName: '',
  ownerPrefix: '+91',
  ownerNumber: '',
}

function fromDriver(d: Driver): Form {
  const p = fromE164(d.phone)
  const o = fromE164(d.ownerPhone)
  return {
    name: d.name,
    prefix: p.prefix,
    number: p.number,
    language: d.language,
    shiftStart: d.shiftStart,
    shiftEnd: d.shiftEnd,
    ownerName: d.ownerName ?? '',
    ownerPrefix: o.prefix,
    ownerNumber: o.number,
  }
}

/** Add and edit share one sheet: a bottom sheet on phones, a centred dialog on wider screens. */
export function DriverForm() {
  const { id } = useParams()
  return id ? <EditSheet id={id} /> : <FormSheet />
}

function EditSheet({ id }: { id: string }) {
  const driver = useDriver(id)
  if (driver.error instanceof AuthError) return <Navigate to="/login" replace />
  if (driver.isError) return <Navigate to="/" replace />
  if (!driver.data) return <div className="sheet-backdrop" />
  return <FormSheet key={id} existing={driver.data} />
}

function FormSheet({ existing }: { existing?: Driver }) {
  const { t } = useLang()
  const toast = useToast()
  const navigate = useNavigate()
  const initial = useMemo(() => (existing ? fromDriver(existing) : blank), [existing])
  const [f, setF] = useState<Form>(initial)
  const [editShift, setEditShift] = useState(!!existing)
  const [submitted, setSubmitted] = useState(false)
  const create = useCreateDriver()
  const update = useUpdateDriver()
  const del = useDeleteDriver()
  const busy = create.isPending || update.isPending
  const [serverError, setServerError] = useState<string>()
  const [confirmRemove, setConfirmRemove] = useState(false)
  const set = <K extends keyof Form>(k: K) => (v: Form[K]) => setF((x) => ({ ...x, [k]: v }))

  const dirty = JSON.stringify(f) !== JSON.stringify(initial)
  const phone = toE164(f.prefix, f.number)
  const ownerPhone = f.ownerNumber.trim() ? toE164(f.ownerPrefix, f.ownerNumber) : null
  const first = f.name.trim() ? ji(f.name) : ''
  const sameTimes = f.shiftStart === f.shiftEnd
  const errors = {
    name: !f.name.trim() ? t.form.nameMissing : undefined,
    phone: !f.number.trim() ? t.form.phoneMissing : !phone ? t.form.phoneInvalid : undefined,
    owner: f.ownerNumber.trim() && !ownerPhone ? t.form.phoneInvalid : undefined,
    shift: sameTimes ? t.form.shiftSame : undefined,
  }
  const valid = !Object.values(errors).some(Boolean)

  const close = () => {
    if (dirty && !window.confirm(t.form.discard)) return
    navigate(existing ? `/drivers/${existing.id}` : '/')
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    setServerError(undefined)
    if (!valid) {
      // On a phone the problem field may be scrolled away; take the owner straight to it.
      requestAnimationFrame(() => document.querySelector<HTMLInputElement>('.sheet [aria-invalid="true"]')?.focus())
      return
    }
    const input: CreateDriverInput = {
      name: f.name.trim(),
      phone: phone!,
      language: f.language,
      shiftStart: f.shiftStart,
      shiftEnd: f.shiftEnd,
      ownerName: f.ownerName.trim() || null,
      ownerPhone,
    }
    try {
      if (existing) {
        await update.mutateAsync({ id: existing.id, input })
        toast({ message: t.form.saved })
        navigate(`/drivers/${existing.id}`)
      } else {
        const { id } = await create.mutateAsync(input)
        toast({ message: t.form.added(first) })
        navigate(`/drivers/${id}`)
      }
    } catch (err) {
      if (err instanceof AuthError) return navigate("/login")
      setServerError(err instanceof ApiError && err.status === 409 ? t.form.duplicate : t.error.generic)
    }
  }

  async function remove() {
    if (!existing) return
    try {
      await del.mutateAsync(existing.id)
      toast({ message: t.form.removed(ji(existing.name)) })
      navigate('/')
    } catch {
      toast({ message: t.error.generic })
    }
  }

  const hours = Math.round(shiftLength(f.shiftStart, f.shiftEnd) / 6) / 10

  return (
    <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && close()}>
      <form className="sheet" onSubmit={save} noValidate role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <header className="sheet-head">
          <h1 id="sheet-title">{existing ? t.form.editTitle : t.form.addTitle}</h1>
          <button type="button" className="icon-btn" onClick={close} aria-label={t.form.close}>
            <X size={20} />
          </button>
        </header>

        <div className="sheet-body">
          <div className="field">
            <label htmlFor="d-name">{t.form.name}</label>
            <input
              id="d-name"
              autoFocus={!existing}
              autoComplete="off"
              value={f.name}
              maxLength={80}
              onChange={(e) => set('name')(e.target.value)}
              placeholder="Ramesh Kumar"
              aria-invalid={submitted && !!errors.name}
            />
            {submitted && errors.name ? (
              <p className="field-error">{errors.name}</p>
            ) : (
              first && <p className="field-note">{t.form.namePreview(first)}</p>
            )}
          </div>

          <PhoneField
            id="d-phone"
            label={t.form.phone}
            prefix={f.prefix}
            number={f.number}
            onPrefix={set('prefix')}
            onNumber={set('number')}
            error={submitted ? errors.phone : undefined}
          />

          <LanguageChips label={t.form.language} value={f.language} onChange={set('language')} />

          <div className="field">
            <span className="label">{t.form.shift}</span>
            {editShift ? (
              <div className="shift-inputs">
                <label>
                  <span className="sr-only">{t.form.shiftFrom}</span>
                  <input type="time" value={f.shiftStart} onChange={(e) => set('shiftStart')(e.target.value)} />
                </label>
                <span className="muted">–</span>
                <label>
                  <span className="sr-only">{t.form.shiftTo}</span>
                  <input type="time" value={f.shiftEnd} onChange={(e) => set('shiftEnd')(e.target.value)} />
                </label>
              </div>
            ) : (
              <p className="shift-line">
                {t.form.shiftSummary(hhmmLabel(f.shiftStart), hhmmLabel(f.shiftEnd))}
                <button type="button" className="link" onClick={() => setEditShift(true)}>
                  {t.form.change}
                </button>
              </p>
            )}
            {errors.shift ? <p className="field-error">{errors.shift}</p> : editShift && <p className="field-note">{t.form.shiftLength(hours, toMinutes(f.shiftEnd) <= toMinutes(f.shiftStart))}</p>}
          </div>

          <fieldset className="group">
            <legend>{t.form.manager}</legend>
            <p className="field-note">{t.form.managerHelp}</p>
            <div className="field">
              <label htmlFor="o-name">
                {t.form.managerName} <span className="field-hint">({t.form.optional})</span>
              </label>
              <input id="o-name" autoComplete="off" value={f.ownerName} maxLength={80} onChange={(e) => set('ownerName')(e.target.value)} placeholder="Vikram" />
            </div>
            <PhoneField
              id="o-phone"
              label={t.form.managerPhone}
              prefix={f.ownerPrefix}
              number={f.ownerNumber}
              onPrefix={set('ownerPrefix')}
              onNumber={set('ownerNumber')}
              error={submitted ? errors.owner : undefined}
            />
            {!f.ownerNumber.trim() && <p className="field-note warn">{t.form.noManagerWarn}</p>}
          </fieldset>

          {existing && (
            <div className="danger-zone">
              {confirmRemove ? (
                <div className="confirm">
                  <p>{t.form.removeConfirm(ji(existing.name))}</p>
                  <div className="confirm-btns">
                    <button type="button" className="btn btn-small" onClick={() => setConfirmRemove(false)} autoFocus>
                      {t.form.keep}
                    </button>
                    <button type="button" className="btn btn-small btn-quiet-danger" onClick={remove}>
                      {t.form.removeYes}
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className="link link-danger" onClick={() => setConfirmRemove(true)}>
                  {t.form.remove}
                </button>
              )}
            </div>
          )}
        </div>

        <footer className="sheet-foot">
          {!existing && first && <p className="field-note">{t.form.welcomeNote(first)}</p>}
          {serverError && <p className="form-error">{serverError}</p>}
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? t.form.saving : existing ? t.form.saveEdit : first ? t.form.save(first) : t.form.saveFallback}
          </button>
        </footer>
      </form>
    </div>
  )
}
