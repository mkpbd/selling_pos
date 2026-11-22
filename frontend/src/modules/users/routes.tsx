import type { RouteObject } from 'react-router'
import { RequirePermission } from '@/modules/authentication'
import { PERMISSIONS } from '@/shared/constants/permissions'

export const usersRoutes: RouteObject[] = [
  {
    path: 'users',
    handle: { crumb: 'Users' },
    element: <RequirePermission permission={PERMISSIONS.USERS_VIEW} />,
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import('./pages/UsersPage')).UsersPage }),
      },
    ],
  },
]
