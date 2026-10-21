import { useQuery, useQueryClient } from '@tanstack/react-query'
import { DriverDocument } from '../graphql/generated'
import { request } from '../lib/graphqlClient'
import { isLive } from '../lib/status'
import type { Driver } from '../lib/types'
import { queryKeys } from './queryClient'

/**
 * One driver. Starts from the fleet list already in the cache, so opening a
 * driver paints instantly, then refreshes from the server.
 */
export function useDriver(id: string) {
  const client = useQueryClient()
  return useQuery<Driver>({
    queryKey: queryKeys.driver(id),
    queryFn: async () => (await request(DriverDocument, { id })).driver,
    initialData: () => client.getQueryData<Driver[]>(queryKeys.drivers)?.find((d) => d.id === id),
    initialDataUpdatedAt: () => client.getQueryState(queryKeys.drivers)?.dataUpdatedAt,
    refetchInterval: (query) => (query.state.data?.calls.some((c) => isLive(c)) ? 5_000 : 30_000),
  })
}
