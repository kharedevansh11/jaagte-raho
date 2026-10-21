import { useQuery } from '@tanstack/react-query'
import { DriversDocument } from '../graphql/generated'
import { request } from '../lib/graphqlClient'
import { deriveState } from '../lib/status'
import type { Driver } from '../lib/types'
import { queryKeys } from './queryClient'

/** The signed-in owner's fleet. Polls faster while any driver is on a live call. */
export function useDrivers() {
  return useQuery<Driver[]>({
    queryKey: queryKeys.drivers,
    queryFn: async () => (await request(DriversDocument)).drivers,
    refetchInterval: (query) =>
      query.state.data?.some((d) => deriveState(d).kind === 'calling') ? 5_000 : 15_000,
  })
}
