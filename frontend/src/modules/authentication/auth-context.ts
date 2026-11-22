import { createContext } from 'react'
import type { Me } from './types'

export interface AuthContextValue {
  user: Me | null
  /** True while the initial `me` request is in flight. */
  isLoading: boolean
  isAuthenticated: boolean
  /** Non-401 failure loading the session (network/5xx). */
  error: unknown
  refetch: () => Promise<unknown>
  /** Store the user after login. */
  setUser: (user: Me | null) => void
  /** Drop all client auth state (used on logout and on 401). */
  clearSession: () => void
  /** Switch active branch: persists it and invalidates every query. */
  switchBranch: (branchId: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
