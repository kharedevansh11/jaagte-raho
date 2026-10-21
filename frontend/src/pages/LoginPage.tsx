import { useState } from 'react'
import { HandleSSOCallback, useAuth, useSignIn } from '@clerk/react'
import { isClerkAPIResponseError } from '@clerk/react/errors'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useLang } from '../app/providers'
import { LangToggle, ThemeToggle, Wordmark } from '../components/Header'

/** Google's "G", kept in its own colours as Google's branding rules require. */
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

export function LoginPage() {
  const { t } = useLang()
  const { signIn } = useSignIn()
  const { isSignedIn } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  // Already signed in (Back button, a bookmark, another tab): straight to the dashboard.
  if (isSignedIn) return <Navigate to="/" replace />

  async function google() {
    setBusy(true)
    setError(undefined)
    // Goes to Google and back to /sso-callback; a first sign-in creates the account.
    const { error } = await signIn.sso({
      strategy: 'oauth_google',
      redirectUrl: '/',
      redirectCallbackUrl: '/sso-callback',
    })
    // Signed in from another tab while this one was open.
    if (isClerkAPIResponseError(error) && error.errors.some((e) => e.code === 'session_exists')) return navigate('/', { replace: true })
    if (error) {
      setError(t.login.failed)
      setBusy(false)
    }
  }

  return (
    <div className="key-page">
      <div className="key-top">
        <ThemeToggle compact />
        <LangToggle />
      </div>
      <div className="key-card">
        <Wordmark />
        <h1>{t.login.title}</h1>
        <p className="muted">{t.login.body}</p>
        <button className="btn btn-block btn-google" onClick={google} disabled={busy}>
          <GoogleMark />
          {busy ? t.login.opening : t.login.google}
        </button>
        {error && <p className="field-error">{error}</p>}
        <p className="field-note">{t.login.newHere}</p>
        <p className="key-try">
          {t.key.tryIt} <Link to="/try">{t.key.tryLink}</Link>
        </p>
      </div>
    </div>
  )
}

/** Where Google sends people back to; finishes sign-in (or sign-up) and opens the dashboard. */
export function SsoCallbackPage() {
  const { t } = useLang()
  const navigate = useNavigate()
  return (
    <div className="key-page">
      <p className="muted">{t.login.finishing}</p>
      <HandleSSOCallback
        navigateToApp={({ decorateUrl }) => {
          const to = decorateUrl('/')
          if (to.startsWith('http')) window.location.href = to
          else navigate(to, { replace: true })
        }}
        navigateToSignIn={() => navigate('/login', { replace: true })}
        navigateToSignUp={() => navigate('/login', { replace: true })}
      />
    </div>
  )
}
