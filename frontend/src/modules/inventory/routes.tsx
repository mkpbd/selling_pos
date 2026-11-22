import type { RouteObject } from 'react-router'
import { RequirePermission } from '@/modules/authentication'
import { PERMISSIONS } from '@/shared/constants/permissions'

export const inventoryRoutes: RouteObject[] = [
  {
    path: 'inventory',
    handle: { crumb: 'Inventory' },
    element: <RequirePermission permission={PERMISSIONS.INVENTORY_VIEW} />,
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import('./pages/StockPage')).StockPage }),
      },
      {
        path: 'movements',
        handle: { crumb: 'Movements' },
        lazy: async () => ({ Component: (await import('./pages/MovementsPage')).MovementsPage }),
      },
    ],
  },
]
