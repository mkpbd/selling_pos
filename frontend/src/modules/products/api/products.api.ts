import { api } from '@/shared/services/http'
import type {
  Category,
  CategoryInput,
  Product,
  ProductInput,
  ProductListParams,
  Unit,
  UnitInput,
} from '../types'

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (params: ProductListParams) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
}

export const categoryKeys = {
  all: ['categories'] as const,
  list: () => [...categoryKeys.all, 'list'] as const,
}

export const unitKeys = {
  all: ['units'] as const,
  list: () => [...unitKeys.all, 'list'] as const,
}

export const productsApi = {
  list: (params: ProductListParams, signal?: AbortSignal) => api.getPaginated<Product>('/products', { params, signal }),
  get: (id: string, signal?: AbortSignal) => api.get<Product>(`/products/${id}`, { signal }),
  create: (input: ProductInput) => api.post<Product>('/products', input),
  update: (id: string, input: ProductInput) => api.put<Product>(`/products/${id}`, input),
}

export const categoriesApi = {
  list: (signal?: AbortSignal) => api.get<Category[]>('/categories', { signal }),
  create: (input: CategoryInput) => api.post<Category>('/categories', input),
  update: (id: string, input: CategoryInput) => api.put<Category>(`/categories/${id}`, input),
  remove: (id: string) => api.delete(`/categories/${id}`),
}

export const unitsApi = {
  list: (signal?: AbortSignal) => api.get<Unit[]>('/units', { signal }),
  create: (input: UnitInput) => api.post<Unit>('/units', input),
  update: (id: string, input: UnitInput) => api.put<Unit>(`/units/${id}`, input),
  remove: (id: string) => api.delete(`/units/${id}`),
}
