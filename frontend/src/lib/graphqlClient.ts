import { getToken } from '@clerk/react'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { print } from 'graphql'
import { ApiError, AuthError } from './errors'

interface GraphQLErrorBody {
  message: string
  extensions?: { code?: string; originalError?: { statusCode?: number; message?: string | string[] } }
}

/**
 * Sends one typed GraphQL operation. The document's types flow through, so
 * `request(DriversDocument)` returns exactly `DriversQuery`.
 */
export async function request<TData, TVariables extends Record<string, unknown>>(
  document: TypedDocumentNode<TData, TVariables>,
  ...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
): Promise<TData> {
  // Clerk hands out short-lived session tokens and refreshes them; ask for one per request.
  const token = await getToken().catch(() => null)
  if (!token) throw new AuthError()

  let res: Response
  try {
    res = await fetch('/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ query: print(document), variables }),
    })
  } catch {
    throw new ApiError('network')
  }

  const body = (await res.json().catch(() => ({}))) as { data?: TData; errors?: GraphQLErrorBody[] }
  const err = body.errors?.[0]
  if (err) {
    const code = err.extensions?.code
    if (code === 'FORBIDDEN' || code === 'UNAUTHENTICATED') throw new AuthError()
    const original = err.extensions?.originalError
    const message = Array.isArray(original?.message) ? original.message[0] : original?.message
    throw new ApiError(message ?? err.message, original?.statusCode)
  }
  if (!res.ok || !body.data) throw new ApiError('server', res.status)
  return body.data
}
