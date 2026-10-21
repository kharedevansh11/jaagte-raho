import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './hooks/queryClient'
import './index.css'
import App from './App.tsx'

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined
const root = createRoot(document.getElementById('root')!)

if (!clerkKey) {
  // Fail loudly in development instead of rendering a broken sign-in.
  root.render(<p style={{ padding: 24, fontFamily: 'system-ui' }}>Set VITE_CLERK_PUBLISHABLE_KEY in frontend/.env.local, then restart the dev server.</p>)
} else {
  root.render(
    <StrictMode>
      <ClerkProvider publishableKey={clerkKey} afterSignOutUrl="/login">
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </ClerkProvider>
    </StrictMode>,
  )
}
