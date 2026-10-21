import { LANGUAGES } from '../lib/strings'

export function PhoneField(props: {
  id: string
  label: string
  hint?: string
  prefix: string
  number: string
  onPrefix: (v: string) => void
  onNumber: (v: string) => void
  error?: string
}) {
  const errId = `${props.id}-err`
  return (
    <div className="field">
      <label htmlFor={props.id}>
        {props.label}
        {props.hint && <span className="field-hint"> ({props.hint})</span>}
      </label>
      <div className={`phone${props.error ? ' invalid' : ''}`}>
        <input
          className="phone-prefix"
          aria-label="Country code"
          inputMode="tel"
          value={props.prefix}
          onChange={(e) => props.onPrefix(e.target.value)}
        />
        <input
          id={props.id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="98765 43210"
          value={props.number}
          onChange={(e) => props.onNumber(e.target.value)}
          aria-invalid={!!props.error}
          aria-describedby={props.error ? errId : undefined}
        />
      </div>
      {props.error && (
        <p className="field-error" id={errId}>
          {props.error}
        </p>
      )}
    </div>
  )
}

export function LanguageChips({
  value,
  onChange,
  label,
  only,
}: {
  value: string
  onChange: (v: string) => void
  label: string
  /** Limit to these codes (the demo page shows only the likeliest few). */
  only?: string[]
}) {
  return (
    <fieldset className="field">
      <legend>{label}</legend>
      <div className="chips" role="radiogroup">
        {LANGUAGES.filter((l) => !only || only.includes(l.code)).map((l) => (
          <label key={l.code} className={`chip${value === l.code ? ' on' : ''}`} lang={l.code}>
            <input
              type="radio"
              name={label}
              value={l.code}
              checked={value === l.code}
              onChange={() => onChange(l.code)}
              aria-label={l.english}
            />
            {l.native}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
