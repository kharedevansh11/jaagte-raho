import { useMutation, useQuery } from '@tanstack/react-query'
import { demoApi } from '../lib/demoApi'
import { ApiError } from '../lib/errors'
import type { DemoCallInput, DemoResult } from '../lib/types'
import { queryKeys } from './queryClient'

/** Rings the visitor's phone for the public demo. */
export function useStartDemoCall() {
  return useMutation({ mutationFn: (input: DemoCallInput) => demoApi.startCall(input) })
}

/** Follows a demo call every 2 s until it finishes, for at most 5 minutes. */
export function useDemoResult(callId: string, startedAt: number) {
  return useQuery<DemoResult, ApiError>({
    queryKey: queryKeys.demoResult(callId),
    queryFn: () => demoApi.result(callId),
    refetchInterval: (query) =>
      query.state.data?.completedAt || Date.now() - startedAt > 5 * 60_000 ? false : 2_000,
    retry: (failures, error) => error.status !== 404 && failures < 3,
  })
}
