import type { AxiosRequestConfig } from 'axios'
import { http } from './client'
import type { ApiPaginatedEnvelope, ApiSuccessEnvelope, Paginated, QueryParamValue } from './types'

/** Drops empty values so they aren't sent as `?search=`. */
export function cleanParams(params: object | undefined): Record<string, string | number | boolean> | undefined {
  if (!params) return undefined
  const out: Record<string, string | number | boolean> = {}
  for (const [key, value] of Object.entries(params) as [string, QueryParamValue][]) {
    if (value === undefined || value === null || value === '') continue
    out[key] = value
  }
  return out
}

async function request<T>(config: AxiosRequestConfig): Promise<ApiSuccessEnvelope<T>> {
  const response = await http.request<ApiSuccessEnvelope<T>>({
    ...config,
    params: cleanParams(config.params as object | undefined),
  })
  return response.data
}

/** Typed wrappers that unwrap the `{ success, data, meta }` envelope. */
export const api = {
  /** Full envelope, for when you need `message` or `meta`. */
  request,

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return (await request<T>({ ...config, url, method: 'GET' })).data
  },

  async getPaginated<T>(url: string, config?: AxiosRequestConfig): Promise<Paginated<T>> {
    const response = await http.request<ApiPaginatedEnvelope<T>>({
      ...config,
      url,
      method: 'GET',
      params: cleanParams(config?.params as object | undefined),
    })
    return { items: response.data.data, pagination: response.data.meta.pagination }
  },

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return (await request<T>({ ...config, url, data, method: 'POST' })).data
  },

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return (await request<T>({ ...config, url, data, method: 'PUT' })).data
  },

  async delete<T = null>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return (await request<T>({ ...config, url, method: 'DELETE' })).data
  },
}
