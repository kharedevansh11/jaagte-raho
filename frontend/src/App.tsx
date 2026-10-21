import { useAuth } from '@clerk/react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Providers } from './app/providers'
import { ShellFrame } from './components/Shell'
import { Dashboard } from './pages/Dashboard'
import { DriverPage } from './pages/DriverPage'
import { DriverForm } from './pages/DriverForm'
import { LoginPage, SsoCallbackPage } from './pages/LoginPage'
import { TryPage } from './pages/TryPage'

/** Signed-out visitors to the home page see the public demo; deeper links ask them to sign in. */
function Owner({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { isLoaded, isSignedIn } = useAuth()
  if (!isLoaded) return <div className="key-page" aria-busy="true" />
  if (!isSignedIn) return <Navigate to={location.pathname === '/' ? '/try' : '/login'} replace />
  return children
}

function OwnerRoutes() {
  const location = useLocation()
  // The add/edit sheet opens over the page underneath, so it never feels like a new screen.
  const sheet = location.pathname === '/drivers/new' || location.pathname.endsWith('/edit')
  const editId = location.pathname.match(/^\/drivers\/([^/]+)\/edit$/)?.[1]
  return (
    <>
      <Routes location={sheet ? (editId ? `/drivers/${editId}` : '/') : location}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/drivers/:id" element={<DriverPage />} />
      </Routes>
      {sheet && (
        <Routes>
          <Route path="/drivers/new" element={<DriverForm />} />
          <Route path="/drivers/:id/edit" element={<DriverForm />} />
        </Routes>
      )}
    </>
  )
}

export default function App() {
  return (
    <Providers>
      <BrowserRouter>
        <Routes>
          <Route path="/try" element={<TryPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/sso-callback" element={<SsoCallbackPage />} />
          <Route path="/key" element={<Navigate to="/login" replace />} />
          <Route
            path="/*"
            element={
              <Owner>
                <ShellFrame>
                  <OwnerRoutes />
                </ShellFrame>
              </Owner>
            }
          />
        </Routes>
      </BrowserRouter>
    </Providers>
  )
}
