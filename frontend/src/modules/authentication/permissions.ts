import type { Permission } from '@/shared/constants/permissions'
import type { Me } from './types'

type PermissionSubject = Pick<Me, 'is_super_admin' | 'permissions'> | null | undefined

/** Super admins bypass every check. UX-only: the API enforces authorization too. */
export function hasPermission(user: PermissionSubject, permission: Permission): boolean {
  if (!user) return false
  return user.is_super_admin || user.permissions.includes(permission)
}

export function hasAnyPermission(user: PermissionSubject, permissions: readonly Permission[]): boolean {
  return permissions.length === 0 ? Boolean(user) : permissions.some((p) => hasPermission(user, p))
}

export function hasAllPermissions(user: PermissionSubject, permissions: readonly Permission[]): boolean {
  return Boolean(user) && permissions.every((p) => hasPermission(user, p))
}
