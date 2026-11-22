import { api } from '@/shared/services/http'
import type { User, UserCreateInput, UserListParams, UserUpdateInput } from '../types'

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params: UserListParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
}

export const usersApi = {
  list: (params: UserListParams, signal?: AbortSignal) => api.getPaginated<User>('/users', { params, signal }),
  get: (id: string, signal?: AbortSignal) => api.get<User>(`/users/${id}`, { signal }),
  create: (input: UserCreateInput) => api.post<User>('/users', input),
  update: (id: string, input: UserUpdateInput) => api.put<User>(`/users/${id}`, input),
}
