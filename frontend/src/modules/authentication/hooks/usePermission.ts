import { useMemo } from 'react'
import type { Permission } from '@/shared/constants/permissions'
import { hasAllPermissions, hasAnyPermission, hasPermission } from '../permissions'
import { useAuth } from './useAuth'

export interface PermissionApi {
  isSuperAdmin: boolean
  can: (permission: Permission) => boolean
  canAny: (permissions: readonly Permission[]) => boolean
  canAll: (permissions: readonly Permission[]) => boolean
}

/** Permission checks for the active branch. */
export function usePermission(): PermissionApi
/** Shorthand: `usePermission('users.create')` returns a boolean. */
export function usePermission(permission: Permission): boolean
export function usePermission(permission?: Permission): PermissionApi | boolean {
  const { user } = useAuth()
  const api = useMemo<PermissionApi>(
    () => ({
      isSuperAdmin: Boolean(user?.is_super_admin),
      can: (p) => hasPermission(user, p),
      canAny: (ps) => hasAnyPermission(user, ps),
      canAll: (ps) => hasAllPermissions(user, ps),
    }),
    [user],
  )
  return permission ? api.can(permission) : api
}
