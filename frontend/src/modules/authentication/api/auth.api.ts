import { ERROR_CODES } from '@/shared/constants/error-codes'
import { api, fetchCsrfCookie, isApiError, notifyUnauthorized } from '@/shared/services/http'
import type { ChangePasswordInput, ForgotPasswordInput, LoginInput, Me, ResetPasswordInput } from '../types'

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
}

export const authApi = {
  /**
   * Returns `null` when there is no session (401) so guards can redirect.
   * A deactivated account (403 ACCOUNT_INACTIVE) is a forced logout.
   * A stale X-Branch-Id (403 BRANCH_ACCESS_DENIED) is retried once without
   * the header by the HTTP client.
   */
  async me(): Promise<Me | null> {
    try {
      return await api.get<Me>('/auth/me', { skipAuthRedirect: true })
    } catch (error) {
      if (isApiError(error)) {
        if (error.status === 401) return null
        if (error.status === 403 && error.code === ERROR_CODES.ACCOUNT_INACTIVE) {
          notifyUnauthorized('inactive')
          return null
        }
      }
      throw error
    }
  },

  async login(input: LoginInput): Promise<Me> {
    await fetchCsrfCookie()
    // No X-Branch-Id on login: a stored branch may belong to a previous user.
    return api.post<Me>('/auth/login', input, { skipAuthRedirect: true, skipBranchHeader: true })
  },

  logout(): Promise<null> {
    return api.post<null>('/auth/logout', undefined, { skipAuthRedirect: true })
  },

  async forgotPassword(input: ForgotPasswordInput): Promise<string | null> {
    await fetchCsrfCookie()
    const res = await api.request<null>({ url: '/auth/forgot-password', method: 'POST', data: input })
    return res.message ?? null
  },

  async resetPassword(input: ResetPasswordInput): Promise<string | null> {
    await fetchCsrfCookie()
    const res = await api.request<null>({ url: '/auth/reset-password', method: 'POST', data: input })
    return res.message ?? null
  },

  changePassword(input: ChangePasswordInput): Promise<null> {
    return api.put<null>('/auth/password', input)
  },
}
