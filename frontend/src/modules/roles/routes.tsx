import type { RouteObject } from 'react-router'
import { RequirePermission } from '@/modules/authentication'
import { PERMISSIONS } from '@/shared/constants/permissions'

export const rolesRoutes: RouteObject[] = [
  {
    path: 'roles',
    handle: { crumb: 'Roles & permissions' },
    element: <RequirePermission permission={PERMISSIONS.ROLES_VIEW} />,
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import('./pages/RolesPage')).RolesPage }),
      },
    ],
  },
]
