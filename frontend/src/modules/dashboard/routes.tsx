import type { RouteObject } from 'react-router'
import { RequirePermission } from '@/modules/authentication'
import { PERMISSIONS } from '@/shared/constants/permissions'

export const dashboardRoutes: RouteObject[] = [
  {
    path: 'dashboard',
    handle: { crumb: 'Dashboard' },
    element: <RequirePermission permission={PERMISSIONS.DASHBOARD_VIEW} />,
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import('./pages/DashboardPage')).DashboardPage }),
      },
    ],
  },
]
