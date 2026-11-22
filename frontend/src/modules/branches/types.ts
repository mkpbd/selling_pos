import type { ListParams } from '@/shared/types'

/** `Branch` resource (contract §4). */
export interface Branch {
  id: string
  code: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  is_active: boolean
  users_count?: number
  created_at: string
  updated_at: string
}

/** `BranchInput` body for POST/PUT /branches. */
export interface BranchInput {
  code: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  is_active: boolean
}

export interface BranchListParams extends ListParams {
  is_active?: boolean
}

export const BRANCH_SORT_FIELDS = ['code', 'name', 'created_at'] as const
