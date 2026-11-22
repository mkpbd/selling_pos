import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../api/auth.api'
import type { ChangePasswordInput, ForgotPasswordInput, LoginInput, ResetPasswordInput } from '../types'
import { useAuth } from './useAuth'

export function useLogin() {
  const queryClient = useQueryClient()
  const { setUser } = useAuth()
  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: (me) => {
      // Fresh session: drop anything cached for a previous user, then store `me`.
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== 'auth' })
      setUser(me)
    },
  })
}

export function useLogout() {
  const { clearSession } = useAuth()
  return useMutation({
    mutationFn: () => authApi.logout(),
    // Clear client state even if the server call fails (e.g. session already gone).
    onSettled: () => clearSession(),
  })
}

export function useForgotPassword() {
  return useMutation({ mutationFn: (input: ForgotPasswordInput) => authApi.forgotPassword(input) })
}

export function useResetPassword() {
  return useMutation({ mutationFn: (input: ResetPasswordInput) => authApi.resetPassword(input) })
}

export function useChangePassword() {
  return useMutation({ mutationFn: (input: ChangePasswordInput) => authApi.changePassword(input) })
}
