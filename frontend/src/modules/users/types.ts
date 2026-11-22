import type { BranchRef, ListParams } from '@/shared/types'

export interface UserBranch extends BranchRef {
  roles: string[]
}

/** `User` resource (contract §5). */
export interface User {
  id: string
  name: string
  email: string
  is_active: boolean
  is_super_admin: boolean
  default_branch_id: string | null
  last_login_at: string | null
  created_at: string
  updated_at: string
  branches: UserBranch[]
}

export interface BranchRoleInput {
  branch_id: string
  roles: string[]
}

export interface UserCreateInput {
  name: string
  email: string
  password: string
  password_confirmation: string
  is_active: boolean
  default_branch_id: string | null
  branch_roles: BranchRoleInput[]
}

/** Same as create, but password fields are optional (omit to keep the current password). */
export type UserUpdateInput = Omit<UserCreateInput, 'password' | 'password_confirmation'> &
  Partial<Pick<UserCreateInput, 'password' | 'password_confirmation'>>

export interface UserListParams extends ListParams {
  is_active?: boolean
  branch_id?: string
}
