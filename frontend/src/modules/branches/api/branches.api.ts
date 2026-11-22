import { api } from '@/shared/services/http'
import type { Branch, BranchInput, BranchListParams } from '../types'

export const branchKeys = {
  all: ['branches'] as const,
  lists: () => [...branchKeys.all, 'list'] as const,
  list: (params: BranchListParams) => [...branchKeys.lists(), params] as const,
  details: () => [...branchKeys.all, 'detail'] as const,
  detail: (id: string) => [...branchKeys.details(), id] as const,
}

export const branchesApi = {
  list: (params: BranchListParams, signal?: AbortSignal) => api.getPaginated<Branch>('/branches', { params, signal }),
  get: (id: string, signal?: AbortSignal) => api.get<Branch>(`/branches/${id}`, { signal }),
  create: (input: BranchInput) => api.post<Branch>('/branches', input),
  update: (id: string, input: BranchInput) => api.put<Branch>(`/branches/${id}`, input),
}
