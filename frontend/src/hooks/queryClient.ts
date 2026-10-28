import { QueryClient } from '@tanstack/react-query'
import { ApiError, AuthError } from '../lib/errors'

/** Every cache key in one place, so invalidation after a change can't miss a query. */
export const queryKeys = {
  drivers: ['drivers'] as const,
  driver: (id: string) => ['driver', id] as const,
  driverCalls: (id: string) => ['driver', id, 'calls'] as const,
  demoResult: (callId: string) => ['demo', callId] as const,
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Show cached data instantly when returning to a page, refresh in the background.
      staleTime: 10_000,
      refetchOnWindowFocus: true,
      // A blip retries quietly; a missing session or a 404 won't get better by retrying.
      retry: (failures, error) =>
        failures < 2 && !(error instanceof AuthError) && !(error instanceof ApiError && (error.status === 404 || error.status === 403)),
      retryDelay: (attempt) => Math.min(1_500 * 2 ** attempt, 10_000),
    },
  },
})
