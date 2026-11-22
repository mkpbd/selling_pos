import type { BranchRef } from '@/shared/types'

/** `GET /auth/me` payload (contract §2). */
export interface Me {
  id: string
  name: string
  email: string
  is_active: boolean
  is_super_admin: boolean
  default_branch_id: string | null
  last_login_at: string | null
  current_branch: BranchRef | null
  branches: BranchRef[]
  roles: string[]
  /** Permissions for the active branch. Super admins receive every permission. */
  permissions: string[]
}

export interface LoginInput {
  email: string
  password: string
  remember?: boolean
}

export interface ForgotPasswordInput {
  email: string
}

export interface ResetPasswordInput {
  token: string
  email: string
  password: string
  password_confirmation: string
}

export interface ChangePasswordInput {
  current_password: string
  password: string
  password_confirmation: string
}
