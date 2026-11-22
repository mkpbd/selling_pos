import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'
import { AppLayout } from '@/app/layouts/AppLayout'
import { AuthLayout } from '@/app/layouts/AuthLayout'
import { GuestOnly, RequireAuth } from '@/modules/authentication'
import { authRoutes } from '@/modules/authentication/routes'
import { branchesRoutes } from '@/modules/branches'
import { dashboardRoutes } from '@/modules/dashboard'
import { inventoryRoutes } from '@/modules/inventory'
import { productsRoutes } from '@/modules/products'
import { rolesRoutes } from '@/modules/roles'
import { usersRoutes } from '@/modules/users'
import { ForbiddenView, NotFoundView } from '@/shared/components/StatusViews'
import { RouteError } from './RouteError'

export const routes: RouteObject[] = [
  {
    errorElement: <RouteError />,
    children: [
      {
        element: <GuestOnly />,
        children: [{ element: <AuthLayout />, children: authRoutes }],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { index: true, element: <Navigate to="/dashboard" replace /> },
              ...dashboardRoutes,
              ...productsRoutes,
              ...inventoryRoutes,
              ...branchesRoutes,
              ...usersRoutes,
              ...rolesRoutes,
              {
                path: 'forbidden',
                handle: { crumb: 'Access denied' },
                element: <ForbiddenView />,
              },
              {
                path: '*',
                handle: { crumb: 'Not found' },
                element: <NotFoundView />,
              },
            ],
          },
        ],
      },
    ],
  },
]

export function createAppRouter() {
  return createBrowserRouter(routes)
}
