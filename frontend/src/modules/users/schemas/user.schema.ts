import { z } from 'zod'
import { emailField } from '@/shared/validation/common'
import { strongPassword } from '@/shared/validation/password'
import type { User, UserCreateInput, UserUpdateInput } from '../types'

export type UserFormMode = 'create' | 'edit'

const branchRoleSchema = z.object({
  branch_id: z.string().min(1, 'Select a branch.'),
  roles: z.array(z.string()).min(1, 'Pick at least one role for this branch.'),
})

export function createUserSchema(mode: UserFormMode) {
  return z
    .object({
      name: z.string().trim().min(1, 'Name is required.').max(150, 'Name may not be greater than 150 characters.'),
      email: emailField,
      password: z.string(),
      password_confirmation: z.string(),
      is_active: z.boolean(),
      default_branch_id: z.string().nullable(),
      branch_roles: z.array(branchRoleSchema),
    })
    .superRefine((data, ctx) => {
      const wantsPassword = mode === 'create' || data.password.length > 0 || data.password_confirmation.length > 0
      if (wantsPassword) {
        const result = strongPassword.safeParse(data.password)
        if (!result.success) {
          ctx.addIssue({
            code: 'custom',
            path: ['password'],
            message: data.password ? (result.error.issues[0]?.message ?? 'Invalid password.') : 'Password is required.',
          })
        }
        if (data.password !== data.password_confirmation) {
          ctx.addIssue({ code: 'custom', path: ['password_confirmation'], message: 'Passwords do not match.' })
        }
      }
      if (data.default_branch_id && !data.branch_roles.some((br) => br.branch_id === data.default_branch_id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['default_branch_id'],
          message: 'The default branch must be one of the assigned branches.',
        })
      }
    })
}

export type UserFormValues = z.input<ReturnType<typeof createUserSchema>>

/** Server field keys this form can display (nested keys resolve to the closest one). */
export const USER_FORM_FIELDS = [
  'name',
  'email',
  'password',
  'password_confirmation',
  'is_active',
  'default_branch_id',
  'branch_roles',
  'branch_roles.*.branch_id',
  'branch_roles.*.roles',
] as const

export function userToFormValues(user?: User | null): UserFormValues {
  return {
    name: user?.name ?? '',
    email: user?.email ?? '',
    password: '',
    password_confirmation: '',
    is_active: user?.is_active ?? true,
    default_branch_id: user?.default_branch_id ?? null,
    branch_roles: user?.branches.map((b) => ({ branch_id: b.id, roles: [...b.roles] })) ?? [],
  }
}

export function toCreatePayload(values: UserFormValues): UserCreateInput {
  return {
    name: values.name.trim(),
    email: values.email.trim(),
    password: values.password,
    password_confirmation: values.password_confirmation,
    is_active: values.is_active,
    default_branch_id: values.default_branch_id,
    branch_roles: values.branch_roles,
  }
}

/** Omits password fields when left blank, so the current password is kept. */
export function toUpdatePayload(values: UserFormValues): UserUpdateInput {
  const { password, password_confirmation, ...rest } = toCreatePayload(values)
  return password ? { ...rest, password, password_confirmation } : rest
}
