import type { RouteObject } from 'react-router'
import { RequirePermission } from '@/modules/authentication'
import { PERMISSIONS } from '@/shared/constants/permissions'

export const productsRoutes: RouteObject[] = [
  {
    path: 'products',
    handle: { crumb: 'Products' },
    element: <RequirePermission permission={PERMISSIONS.PRODUCTS_VIEW} />,
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import('./pages/ProductsPage')).ProductsPage }),
      },
      {
        path: 'catalog',
        handle: { crumb: 'Catalog settings' },
        element: <RequirePermission permission={PERMISSIONS.CATALOG_MANAGE} />,
        children: [
          {
            index: true,
            lazy: async () => ({ Component: (await import('./pages/CatalogPage')).CatalogPage }),
          },
        ],
      },
    ],
  },
]
