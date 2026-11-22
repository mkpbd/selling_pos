import { z } from 'zod'
import { optionalEmail, optionalText } from '@/shared/validation/common'
import type { Branch, BranchInput } from '../types'

/** Mirrors `BranchInput` rules: code 2–20 chars, A-Z 0-9 and dashes, stored uppercase. */
export const branchCodeSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(
    z
      .string()
      .min(2, 'Code must be at least 2 characters.')
      .max(20, 'Code may not be greater than 20 characters.')
      .regex(/^[A-Z0-9-]+$/, 'Code may only contain letters A–Z, numbers and dashes.'),
  )

export const branchSchema = z.object({
  code: branchCodeSchema,
  name: z.string().trim().min(1, 'Name is required.').max(150, 'Name may not be greater than 150 characters.'),
  phone: optionalText(30, 'Phone'),
  email: optionalEmail,
  address: optionalText(500, 'Address'),
  is_active: z.boolean(),
})

export type BranchFormValues = z.input<typeof branchSchema>
export type BranchFormOutput = z.output<typeof branchSchema>

// Compile-time check that the schema output matches the API contract.
const _contractCheck = (v: BranchFormOutput): BranchInput => v
void _contractCheck

export const BRANCH_FORM_FIELDS = ['code', 'name', 'phone', 'email', 'address', 'is_active'] as const

export function branchToFormValues(branch?: Branch | null): BranchFormValues {
  return {
    code: branch?.code ?? '',
    name: branch?.name ?? '',
    phone: branch?.phone ?? '',
    email: branch?.email ?? '',
    address: branch?.address ?? '',
    is_active: branch?.is_active ?? true,
  }
}
