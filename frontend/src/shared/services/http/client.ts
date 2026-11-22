import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/app/config/env'
import { ERROR_CODES } from '@/shared/constants/error-codes'
import { getActiveBranchId, setActiveBranchId } from '@/shared/services/branch-context'
import { normalizeError } from './api-error'
import { notifyUnauthorized } from './auth-events'
import { fetchCsrfCookie } from './csrf'

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Don't trigger the global "session expired" handler on 401 (e.g. `GET /auth/me`, login). */
    skipAuthRedirect?: boolean
    /** Don't attach the `X-Branch-Id` header. */
    skipBranchHeader?: boolean
    /** @internal retry markers */
    _csrfRetried?: boolean
    _branchRetried?: boolean
  }
}

export const BRANCH_HEADER = 'X-Branch-Id'
const XSRF_HEADER = 'X-XSRF-TOKEN'

export const http = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: XSRF_HEADER,
  timeout: 30_000,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

export function attachBranchHeader(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const branchId = getActiveBranchId()
  if (branchId && !config.skipBranchHeader && !config.headers.has(BRANCH_HEADER)) {
    config.headers.set(BRANCH_HEADER, branchId)
  }
  return config
}

export async function handleResponseError(error: AxiosError): Promise<never> {
  const config = error.config
  const apiError = normalizeError(error)

  if (config) {
    // 419: CSRF token expired. Refresh the cookie once and replay the request.
    if (apiError.status === 419 && !config._csrfRetried) {
      config._csrfRetried = true
      await fetchCsrfCookie()
      config.headers.delete(XSRF_HEADER)
      return http.request(config)
    }

    // 403 BRANCH_ACCESS_DENIED: the stored branch is stale. Drop it and let the
    // server fall back to the user's default branch.
    if (
      apiError.status === 403 &&
      apiError.code === ERROR_CODES.BRANCH_ACCESS_DENIED &&
      !config._branchRetried &&
      config.headers.has(BRANCH_HEADER)
    ) {
      config._branchRetried = true
      config.headers.delete(BRANCH_HEADER)
      config.skipBranchHeader = true
      setActiveBranchId(null)
      return http.request(config)
    }

    if (!config.skipAuthRedirect) {
      if (apiError.status === 401) notifyUnauthorized('expired')
      // A deactivated account is treated like a forced logout.
      else if (apiError.status === 403 && apiError.code === ERROR_CODES.ACCOUNT_INACTIVE) notifyUnauthorized('inactive')
    }
  }

  throw apiError
}

http.interceptors.request.use(attachBranchHeader)
http.interceptors.response.use((response) => response, handleResponseError)
