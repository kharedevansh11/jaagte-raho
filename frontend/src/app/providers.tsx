import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { STRINGS, type Lang, type Strings } from '../lib/strings'

interface LangCtx {
  lang: Lang
  t: Strings
  setLang: (l: Lang) => void
  theme: ThemeMode
  setTheme: (m: ThemeMode) => void
}

export type ThemeMode = 'auto' | 'light' | 'dark'
const THEME_KEY = 'jr.theme'

/** Owners mostly check in at night, so "auto" goes dark from 7 pm to 7 am IST. */
export function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode !== 'auto') return mode
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', hourCycle: 'h23' }).format(new Date()))
  return hour >= 19 || hour < 7 ? 'dark' : 'light'
}

function initialTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'auto' || saved === 'light' || saved === 'dark') return saved
  } catch {
    /* storage blocked: use auto */
  }
  return 'auto'
}

interface Toast {
  message: string
  action?: { label: string; run: () => void }
}

const LangContext = createContext<LangCtx | null>(null)
const ToastContext = createContext<((t: Toast) => void) | null>(null)

const LANG_KEY = 'jr.lang'

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY)
    if (saved === 'en' || saved === 'hi') return saved
  } catch {
    /* storage blocked: fall through to the browser language */
  }
  return navigator.language.startsWith('hi') ? 'hi' : 'en'
}

export function Providers({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)
  const [toast, setToast] = useState<Toast | null>(null)
  const [theme, setThemeState] = useState<ThemeMode>(initialTheme)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem(LANG_KEY, l)
    } catch {
      /* not persisted, still applied */
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setTheme = useCallback((m: ThemeMode) => {
    setThemeState(m)
    try {
      localStorage.setItem(THEME_KEY, m)
    } catch {
      /* not persisted, still applied */
    }
  }, [])

  useEffect(() => {
    const apply = () => {
      const resolved = resolveTheme(theme)
      document.documentElement.dataset.theme = resolved
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#0a0a0a' : '#ffffff')
    }
    apply()
    // In auto mode, flip at 7 am / 7 pm without a reload.
    const id = setInterval(apply, 60_000)
    return () => clearInterval(id)
  }, [theme])

  const show = useCallback((t: Toast) => {
    clearTimeout(timer.current)
    setToast(t)
    timer.current = setTimeout(() => setToast(null), t.action ? 6000 : 3500)
  }, [])

  return (
    <LangContext.Provider value={{ lang, t: STRINGS[lang], setLang, theme, setTheme }}>
      <ToastContext.Provider value={show}>
        {children}
        <div className="toast-region" role="status" aria-live="polite">
          {toast && (
            <div className="toast">
              <span>{toast.message}</span>
              {toast.action && (
                <button
                  className="toast-action"
                  onClick={() => {
                    toast.action!.run()
                    setToast(null)
                  }}
                >
                  {toast.action.label}
                </button>
              )}
            </div>
          )}
        </div>
      </ToastContext.Provider>
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)!
export const useToast = () => useContext(ToastContext)!
