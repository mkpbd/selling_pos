import type { RouteObject } from 'react-router'

/** Guest-only auth routes (rendered inside GuestOnly + AuthLayout by the app router). */
export const authRoutes: RouteObject[] = [
  {
    path: 'login',
    lazy: async () => ({ Component: (await import('./pages/LoginPage')).LoginPage }),
  },
  {
    path: 'forgot-password',
    lazy: async () => ({ Component: (await import('./pages/ForgotPasswordPage')).ForgotPasswordPage }),
  },
  {
    path: 'reset-password',
    lazy: async () => ({ Component: (await import('./pages/ResetPasswordPage')).ResetPasswordPage }),
  },
]
