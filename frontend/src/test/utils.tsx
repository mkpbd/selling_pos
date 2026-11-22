import type { ReactElement, ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '@/modules/authentication/auth-context'
import type { Me } from '@/modules/authentication/types'

export function makeMe(overrides: Partial<Me> = {}): Me {
  return {
    id: 'u-1',
    name: 'Jane Admin',
    email: 'jane@example.com',
    is_active: true,
    is_super_admin: false,
    default_branch_id: 'b-1',
    last_login_at: null,
    current_branch: { id: 'b-1', code: 'HQ', name: 'Head Office' },
    branches: [{ id: 'b-1', code: 'HQ', name: 'Head Office' }],
    roles: ['manager'],
    permissions: ['dashboard.view', 'users.view'],
    ...overrides,
  }
}

export function makeAuth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  const user = overrides.user === undefined ? makeMe() : overrides.user
  return {
    user,
    isLoading: false,
    isAuthenticated: Boolean(user),
    error: null,
    refetch: vi.fn(() => Promise.resolve()),
    setUser: vi.fn(),
    clearSession: vi.fn(),
    switchBranch: vi.fn(() => Promise.resolve()),
    ...overrides,
  }
}

interface ProviderOptions extends Omit<RenderOptions, 'wrapper'> {
  auth?: AuthContextValue
  route?: string
}

export function renderWithProviders(ui: ReactElement, { auth = makeAuth(), route = '/', ...options }: ProviderOptions = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={auth}>
          <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    )
  }
  return { queryClient, auth, ...render(ui, { wrapper: Wrapper, ...options }) }
}
