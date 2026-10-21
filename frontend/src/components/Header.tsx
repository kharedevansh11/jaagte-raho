import { Moon, Sun, SunMoon } from 'lucide-react'
import { resolveTheme, useLang, type ThemeMode } from '../app/providers'

export function Wordmark() {
  return (
    <span className="wordmark">
      <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden>
        <path d="M10.3 2.2a6.2 6.2 0 1 0 3.4 10.9A6.9 6.9 0 0 1 10.3 2.2Z" fill="var(--accent)" />
      </svg>
      Jaagte Raho
    </span>
  )
}

export function LangToggle() {
  const { lang, setLang } = useLang()
  return (
    <div className="lang-toggle" role="group" aria-label="Language">
      <button aria-pressed={lang === 'hi'} onClick={() => setLang('hi')} lang="hi">
        हिं
      </button>
      <button aria-pressed={lang === 'en'} onClick={() => setLang('en')}>
        EN
      </button>
    </div>
  )
}

/**
 * Every click flips what's on screen. If the result is what Auto would show anyway
 * (dark from 7 pm to 7 am), it goes back to Auto so it keeps following the clock.
 */
function flip(mode: ThemeMode): ThemeMode {
  const next = resolveTheme(mode) === 'dark' ? 'light' : 'dark'
  return resolveTheme('auto') === next ? 'auto' : next
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme, t } = useLang()
  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : SunMoon
  const label = t.theme[theme]
  return (
    <button
      className={`theme-toggle${compact ? ' icon-only' : ''}`}
      onClick={() => setTheme(flip(theme))}
      aria-label={`${t.theme.label}: ${label}`}
      title={`${t.theme.label}: ${label}`}
    >
      <Icon size={16} aria-hidden />
      {!compact && label}
    </button>
  )
}
