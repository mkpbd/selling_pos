import type { ErrorCode } from '@/shared/constants/error-codes'

export interface ResponseMeta {
  request_id: string
}

export interface PaginationMeta {
  page: number
  per_page: number
  total: number
  last_page: number
}

export interface ApiSuccessEnvelope<T> {
  success: true
  data: T
  message?: string | null
  meta: ResponseMeta
}

export interface ApiPaginatedEnvelope<T> {
  success: true
  data: T[]
  message?: string | null
  meta: ResponseMeta & { pagination: PaginationMeta }
}

export type FieldErrors = Record<string, string[]>

export interface ApiErrorEnvelope {
  success: false
  error: {
    code: ErrorCode
    message: string
    details?: FieldErrors | null
  }
  meta?: Partial<ResponseMeta>
}

/** Normalised paginated result used across the app. */
export interface Paginated<T> {
  items: T[]
  pagination: PaginationMeta
}

/** Common list query parameters (contract §1 "List query parameters"). */
export interface ListParams {
  page?: number
  per_page?: number
  search?: string
  /** Field name; prefix with `-` for descending. */
  sort?: string
}

export type QueryParamValue = string | number | boolean | null | undefined
