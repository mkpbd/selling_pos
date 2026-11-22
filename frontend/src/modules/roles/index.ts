// Public API of the roles module.
export { rolesApi, roleKeys } from './api/roles.api'
export { usePermissionGroups, useRoles } from './hooks/useRoles'
export { rolesRoutes } from './routes'
export type { PermissionGroup, Role, RoleInput } from './types'
