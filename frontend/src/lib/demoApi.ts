// The public "try it now" endpoints are plain REST: no sign-in, rate limited on the server.
import { ApiError } from './errors'
import type { DemoCallInput, DemoResult } from './types'

async function rest<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, init)
  } catch {
    throw new ApiError('network')
  }
  const body = (await res.json().catch(() => ({}))) as { message?: string | string[] }
  if (!res.ok) {
    const message = Array.isArray(body.message) ? body.message[0] : body.message
    throw new ApiError(message ?? 'server', res.status)
  }
  return body as T
}

export const demoApi = {
  startCall: (input: DemoCallInput) =>
    rest<{ callId: string }>('/demo/call', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    }),
  result: (callId: string) => rest<DemoResult>(`/demo/calls/${encodeURIComponent(callId)}`),
}
