/** The session is missing or expired: send the owner to /login. */
export class AuthError extends Error {}

/** Anything else that went wrong talking to the backend. `status` is the HTTP-like code when known. */
export class ApiError extends Error {
  readonly status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.status = status
  }
}
