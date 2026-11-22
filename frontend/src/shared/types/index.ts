export type {
  ListParams,
  Paginated,
  PaginationMeta,
  FieldErrors,
} from '@/shared/services/http/types'

/** Branch reference as embedded in `Me` and `User` payloads. */
export interface BranchRef {
  id: string
  code: string
  name: string
}

export type Theme = 'light' | 'dark' | 'system'
