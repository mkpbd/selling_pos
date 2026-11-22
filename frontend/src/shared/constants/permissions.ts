/**
 * Permission names defined by the backend (see docs/api-contract.md §3).
 * Frontend gating is UX only — the API enforces authorization on every request.
 */
export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard.view',
  BRANCHES_VIEW: 'branches.view',
  BRANCHES_CREATE: 'branches.create',
  BRANCHES_UPDATE: 'branches.update',
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  ROLES_VIEW: 'roles.view',
  ROLES_MANAGE: 'roles.manage',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
