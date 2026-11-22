import type { ReactNode } from 'react'
import type { Permission } from '@/shared/constants/permissions'
import { usePermission } from '../hooks/usePermission'

interface CanProps {
  /** One permission, or a list combined with `mode`. */
  permission: Permission | readonly Permission[]
  /** For a list: `any` (default) or `all`. */
  mode?: 'any' | 'all'
  fallback?: ReactNode
  children: ReactNode
}

/** Renders children only when the current user holds the permission(s). UX-only gating. */
export function Can({ permission, mode = 'any', fallback = null, children }: CanProps) {
  const { can, canAny, canAll } = usePermission()
  const list = typeof permission === 'string' ? [permission] : permission
  const allowed = typeof permission === 'string' ? can(permission) : mode === 'all' ? canAll(list) : canAny(list)
  return <>{allowed ? children : fallback}</>
}
