import { api } from '@/shared/services/http'
import type { PermissionGroup, Role, RoleInput } from '../types'

export const roleKeys = {
  all: ['roles'] as const,
  list: () => [...roleKeys.all, 'list'] as const,
  detail: (id: number) => [...roleKeys.all, 'detail', id] as const,
  permissions: () => ['permissions'] as const,
}

export const rolesApi = {
  list: (signal?: AbortSignal) => api.get<Role[]>('/roles', { signal }),
  get: (id: number, signal?: AbortSignal) => api.get<Role>(`/roles/${id}`, { signal }),
  create: (input: RoleInput) => api.post<Role>('/roles', input),
  update: (id: number, input: RoleInput) => api.put<Role>(`/roles/${id}`, input),
  remove: (id: number) => api.delete(`/roles/${id}`),
  permissions: (signal?: AbortSignal) => api.get<PermissionGroup[]>('/permissions', { signal }),
}
