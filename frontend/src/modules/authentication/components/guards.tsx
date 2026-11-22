import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { ErrorState } from '@/shared/components/ErrorState'
import { FullScreenLoader } from '@/shared/components/FullScreenLoader'
import { ForbiddenView } from '@/shared/components/StatusViews'
import type { Permission } from '@/shared/constants/permissions'
import { useAuth } from '../hooks/useAuth'
import { usePermission } from '../hooks/usePermission'

/** Only signed-in users; otherwise redirect to /login and remember where they were going. */
export function RequireAuth() {
  const { user, isLoading, error, refetch } = useAuth()
  const location = useLocation()

  if (isLoading) return <FullScreenLoader label="Checking your session…" />
  if (!user && error) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <ErrorState error={error} onRetry={() => void refetch()} title="We couldn't load your session" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}

/** Only signed-out users (login, forgot/reset password). */
export function GuestOnly() {
  const { user, isLoading } = useAuth()
  const location = useLocation()
  if (isLoading) return <FullScreenLoader />
  if (user) {
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname
    return <Navigate to={from && from !== '/login' ? from : '/dashboard'} replace />
  }
  return <Outlet />
}

interface RequirePermissionProps {
  permission: Permission | readonly Permission[]
  children?: ReactNode
}

/** Route-level permission gate (UX only; the API enforces authorization). */
export function RequirePermission({ permission, children }: RequirePermissionProps) {
  const { can, canAny } = usePermission()
  const allowed = typeof permission === 'string' ? can(permission) : canAny(permission)
  if (!allowed) return <ForbiddenView />
  return children ?? <Outlet />
}
