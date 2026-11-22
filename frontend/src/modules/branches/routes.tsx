import type { RouteObject } from 'react-router'
import { RequirePermission } from '@/modules/authentication'
import { PERMISSIONS } from '@/shared/constants/permissions'

export const branchesRoutes: RouteObject[] = [
  {
    path: 'branches',
    handle: { crumb: 'Branches' },
    element: <RequirePermission permission={PERMISSIONS.BRANCHES_VIEW} />,
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import('./pages/BranchesPage')).BranchesPage }),
      },
    ],
  },
]
