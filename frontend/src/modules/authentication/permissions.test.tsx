import { renderHook, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { PERMISSIONS } from '@/shared/constants/permissions'
import { makeAuth, makeMe, renderWithProviders } from '@/test/utils'
import { AuthContext } from './auth-context'
import { Can } from './components/Can'
import { usePermission } from './hooks/usePermission'

function wrapperFor(auth: ReturnType<typeof makeAuth>) {
  return ({ children }: { children: ReactNode }) => <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

describe('usePermission', () => {
  it('grants only the permissions the user holds', () => {
    const auth = makeAuth({ user: makeMe({ permissions: ['users.view'] }) })
    const { result } = renderHook(() => usePermission(), { wrapper: wrapperFor(auth) })

    expect(result.current.can(PERMISSIONS.USERS_VIEW)).toBe(true)
    expect(result.current.can(PERMISSIONS.USERS_CREATE)).toBe(false)
    expect(result.current.canAny([PERMISSIONS.USERS_CREATE, PERMISSIONS.USERS_VIEW])).toBe(true)
    expect(result.current.canAll([PERMISSIONS.USERS_CREATE, PERMISSIONS.USERS_VIEW])).toBe(false)
    expect(result.current.isSuperAdmin).toBe(false)
  })

  it('lets super admins bypass every check, even with an empty permission list', () => {
    const auth = makeAuth({ user: makeMe({ is_super_admin: true, permissions: [] }) })
    const { result } = renderHook(() => usePermission(), { wrapper: wrapperFor(auth) })

    expect(result.current.isSuperAdmin).toBe(true)
    expect(result.current.can(PERMISSIONS.ROLES_MANAGE)).toBe(true)
    expect(result.current.canAll(Object.values(PERMISSIONS))).toBe(true)
  })

  it('denies everything when signed out', () => {
    const auth = makeAuth({ user: null })
    const { result } = renderHook(() => usePermission(PERMISSIONS.DASHBOARD_VIEW), { wrapper: wrapperFor(auth) })
    expect(result.current).toBe(false)
  })
})

describe('<Can>', () => {
  it('renders children when allowed and the fallback otherwise', () => {
    const auth = makeAuth({ user: makeMe({ permissions: ['branches.view'] }) })
    renderWithProviders(
      <>
        <Can permission={PERMISSIONS.BRANCHES_VIEW}>
          <button>View branches</button>
        </Can>
        <Can permission={PERMISSIONS.BRANCHES_CREATE} fallback={<span>No create access</span>}>
          <button>New branch</button>
        </Can>
      </>,
      { auth },
    )

    expect(screen.getByRole('button', { name: 'View branches' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'New branch' })).not.toBeInTheDocument()
    expect(screen.getByText('No create access')).toBeInTheDocument()
  })

  it('supports any/all modes for permission lists', () => {
    const auth = makeAuth({ user: makeMe({ permissions: ['users.view'] }) })
    renderWithProviders(
      <>
        <Can permission={[PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_CREATE]}>
          <span>any-ok</span>
        </Can>
        <Can permission={[PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_CREATE]} mode="all">
          <span>all-ok</span>
        </Can>
      </>,
      { auth },
    )
    expect(screen.getByText('any-ok')).toBeInTheDocument()
    expect(screen.queryByText('all-ok')).not.toBeInTheDocument()
  })

  it('shows gated content to super admins', () => {
    const auth = makeAuth({ user: makeMe({ is_super_admin: true, permissions: [] }) })
    renderWithProviders(
      <Can permission={PERMISSIONS.ROLES_MANAGE}>
        <span>manage roles</span>
      </Can>,
      { auth },
    )
    expect(screen.getByText('manage roles')).toBeInTheDocument()
  })
})
