import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getActiveBranchId, setActiveBranchId } from '@/shared/services/branch-context'
import { setUnauthorizedHandler } from '@/shared/services/http'
import { authApi, authKeys } from '../api/auth.api'
import { AuthContext, type AuthContextValue } from '../auth-context'
import type { Me } from '../types'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  const meQuery = useQuery({
    queryKey: authKeys.me(),
    queryFn: authApi.me,
    staleTime: 5 * 60_000,
  })

  const user = meQuery.data ?? null
  const userRef = useRef<Me | null>(user)
  useEffect(() => {
    userRef.current = user
  }, [user])

  const setUser = useCallback(
    (next: Me | null) => {
      if (next?.current_branch) setActiveBranchId(next.current_branch.id)
      queryClient.setQueryData(authKeys.me(), next)
    },
    [queryClient],
  )

  const clearSession = useCallback(() => {
    queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== authKeys.all[0] })
    queryClient.setQueryData(authKeys.me(), null)
    setActiveBranchId(null)
  }, [queryClient])

  // Global 401 handler: drop auth state. RequireAuth then redirects to /login.
  useEffect(() => {
    setUnauthorizedHandler((reason) => {
      if (reason === 'inactive') {
        toast.error('Your account has been deactivated. Contact an administrator.', { id: 'session-ended' })
      } else if (userRef.current) {
        toast.error('Your session has expired. Please sign in again.', { id: 'session-ended' })
      }
      clearSession()
    })
    return () => setUnauthorizedHandler(null)
  }, [clearSession])

  // Keep the persisted branch in sync with what the server resolved.
  useEffect(() => {
    const resolved = user?.current_branch?.id
    if (resolved && getActiveBranchId() !== resolved) setActiveBranchId(resolved)
  }, [user])

  const switchBranch = useCallback(
    async (branchId: string) => {
      if (branchId === getActiveBranchId()) return
      setActiveBranchId(branchId)
      await queryClient.invalidateQueries()
    },
    [queryClient],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading: meQuery.isPending,
      isAuthenticated: Boolean(user),
      error: meQuery.error,
      refetch: meQuery.refetch,
      setUser,
      clearSession,
      switchBranch,
    }),
    [user, meQuery.isPending, meQuery.error, meQuery.refetch, setUser, clearSession, switchBranch],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
