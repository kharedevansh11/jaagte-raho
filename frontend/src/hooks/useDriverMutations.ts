import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CallDriverNowDocument,
  CreateDriverDocument,
  DeleteDriverDocument,
  UpdateDriverDocument,
  type CreateDriverInput,
} from '../graphql/generated'
import { request } from '../lib/graphqlClient'
import type { DriverInput } from '../lib/types'
import { queryKeys } from './queryClient'

/** Refresh everything that shows this driver after a change. */
function useRefreshDriver() {
  const client = useQueryClient()
  return (id?: string) =>
    Promise.all([
      client.invalidateQueries({ queryKey: queryKeys.drivers }),
      id && client.invalidateQueries({ queryKey: queryKeys.driver(id) }),
    ])
}

export function useCreateDriver() {
  const refresh = useRefreshDriver()
  return useMutation({
    mutationFn: async (input: CreateDriverInput) => (await request(CreateDriverDocument, { input })).createDriver,
    onSuccess: () => refresh(),
  })
}

export function useUpdateDriver() {
  const refresh = useRefreshDriver()
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: DriverInput }) =>
      (await request(UpdateDriverDocument, { id, input })).updateDriver,
    onSuccess: (_, { id }) => refresh(id),
  })
}

export function useDeleteDriver() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => (await request(DeleteDriverDocument, { id })).deleteDriver,
    onSuccess: (_, id) => {
      client.removeQueries({ queryKey: queryKeys.driver(id) })
      return client.invalidateQueries({ queryKey: queryKeys.drivers })
    },
  })
}

export function useCallDriverNow() {
  const refresh = useRefreshDriver()
  return useMutation({
    mutationFn: async (id: string) => (await request(CallDriverNowDocument, { id })).callDriverNow,
    // Refresh on failure too: a failed dial still shows up in the timeline.
    onSettled: (_, __, id) => refresh(id),
  })
}
