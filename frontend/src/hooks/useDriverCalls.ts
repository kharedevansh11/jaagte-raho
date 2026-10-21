import { useInfiniteQuery } from '@tanstack/react-query'
import { DriverCallsDocument } from '../graphql/generated'
import { request } from '../lib/graphqlClient'
import { isLive } from '../lib/status'
import type { Call } from '../lib/types'
import { queryKeys } from './queryClient'

const PAGE_SIZE = 20

/** A driver's call history, newest first, one page of 20 at a time ("Show older calls"). */
export function useDriverCalls(driverId: string) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.driverCalls(driverId),
    queryFn: async ({ pageParam }) =>
      (await request(DriverCallsDocument, { driverId, take: PAGE_SIZE, after: pageParam })).driverCalls,
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    // Follow a live call closely so its result lands in the timeline as soon as it ends.
    refetchInterval: (q) => (q.state.data?.pages[0]?.items.some((c) => isLive(c)) ? 5_000 : 30_000),
  })
  const calls: Call[] = query.data?.pages.flatMap((p) => p.items) ?? []
  return { ...query, calls }
}
