export type UnauthorizedReason = 'expired' | 'inactive'

type Handler = (reason: UnauthorizedReason) => void

let unauthorizedHandler: Handler | null = null

/**
 * Registered by the AuthProvider; invoked when an authenticated request returns
 * 401 (session expired) or 403 ACCOUNT_INACTIVE (account deactivated).
 */
export function setUnauthorizedHandler(handler: Handler | null): void {
  unauthorizedHandler = handler
}

export function notifyUnauthorized(reason: UnauthorizedReason = 'expired'): void {
  unauthorizedHandler?.(reason)
}
