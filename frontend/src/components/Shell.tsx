import type { ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, LogOut, PhoneCall, UserPlus } from 'lucide-react'
import { useClerk, useUser } from '@clerk/react'
import { useLang } from '../app/providers'
import { LangToggle, ThemeToggle, Wordmark } from './Header'
import { useQueryClient } from '@tanstack/react-query'

/**
 * Owner app frame: a sidebar on desktop, a compact top bar on phones.
 * Rendered once around every owner page, so moving between pages never rebuilds it.
 */
export function ShellFrame({ children }: { children: ReactNode }) {
  const { t } = useLang()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  // Driver pages live under Overview, so keep it highlighted there.
  const onOverview = pathname === '/' || (pathname.startsWith('/drivers/') && pathname !== '/drivers/new')
  const { signOut: clerkSignOut } = useClerk()
  const { user } = useUser()
  const queryClient = useQueryClient()
  const signOut = () => {
    // Forget all cached data, so the next person never sees this owner's drivers.
    queryClient.clear()
    void clerkSignOut().then(() => navigate('/login'))
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Wordmark />
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" className={() => `nav-item${onOverview ? ' active' : ''}`}>
            <LayoutDashboard size={19} aria-hidden /> {t.nav.overview}
          </NavLink>
          <NavLink to="/drivers/new" className="nav-item">
            <UserPlus size={19} aria-hidden /> {t.addDriver}
          </NavLink>
          <a href="/try" target="_blank" rel="noreferrer" className="nav-item">
            <PhoneCall size={19} aria-hidden /> {t.nav.demo}
          </a>
        </nav>
        <div className="sidebar-foot">
          <div className="sidebar-prefs">
            <LangToggle />
            <ThemeToggle />
          </div>
          {user && (
            <div className="sidebar-user">
              <Avatar name={user.fullName ?? user.primaryEmailAddress?.emailAddress ?? '?'} size={32} />
              <span className="sidebar-user-text">
                <span className="sidebar-user-name">{user.fullName ?? user.firstName}</span>
                <span className="sidebar-user-mail">{user.primaryEmailAddress?.emailAddress}</span>
              </span>
            </div>
          )}
          <button className="nav-item nav-button" onClick={signOut}>
            <LogOut size={19} aria-hidden /> {t.signOut}
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="mobile-bar">
          <Wordmark />
          <div className="mobile-bar-right">
            <ThemeToggle compact />
            <LangToggle />
            <button className="icon-btn" aria-label={t.signOut} onClick={signOut}>
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {children}
      </div>
    </div>
  )
}

/** One page inside the frame: its title and main actions, then its content. */
export function Shell({
  title,
  subtitle,
  actions,
  back,
  children,
}: {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  back?: ReactNode
  children: ReactNode
}) {
  return (
    <>
      <div className="page-head">
        <div className="page-head-text">
          {back}
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-sub">{subtitle}</p>}
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </div>
      <main className="content">{children}</main>
    </>
  )
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const parts = name.trim().split(/\s+/)
  const initials = (parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.36 }} aria-hidden>
      {initials.toUpperCase()}
    </span>
  )
}
