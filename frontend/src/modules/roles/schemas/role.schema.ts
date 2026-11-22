import { z } from 'zod'
import type { Role } from '../types'

export const roleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required.')
    .max(100, 'Name may not be greater than 100 characters.')
    .regex(/^[a-z0-9_-]+$/, 'Use lowercase letters, numbers, dashes and underscores only.'),
  permissions: z.array(z.string()),
})

export type RoleFormValues = z.input<typeof roleSchema>
export type RoleFormOutput = z.output<typeof roleSchema>

export function roleToFormValues(role?: Role | null): RoleFormValues {
  return { name: role?.name ?? '', permissions: role?.permissions ?? [] }
}
