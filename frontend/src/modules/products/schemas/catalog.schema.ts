import { z } from 'zod'
import { optionalText } from '@/shared/validation/common'
import type { Category, CategoryInput, Unit, UnitInput } from '../types'

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(100, 'Name may not be greater than 100 characters.'),
  description: optionalText(500, 'Description'),
  is_active: z.boolean(),
})
export type CategoryFormValues = z.input<typeof categorySchema>
export type CategoryFormOutput = z.output<typeof categorySchema>
const _categoryContract = (v: CategoryFormOutput): CategoryInput => v
void _categoryContract

export function categoryToFormValues(category?: Category | null): CategoryFormValues {
  return {
    name: category?.name ?? '',
    description: category?.description ?? '',
    is_active: category?.is_active ?? true,
  }
}

export const unitSchema = z.object({
  code: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase())
    .pipe(
      z
        .string()
        .min(1, 'Code is required.')
        .max(10, 'Code may not be greater than 10 characters.')
        .regex(/^[A-Z0-9]+$/, 'Code may only contain letters A–Z and numbers.'),
    ),
  name: z.string().trim().min(1, 'Name is required.').max(50, 'Name may not be greater than 50 characters.'),
  allows_decimal: z.boolean(),
})
export type UnitFormValues = z.input<typeof unitSchema>
export type UnitFormOutput = z.output<typeof unitSchema>
const _unitContract = (v: UnitFormOutput): UnitInput => v
void _unitContract

export function unitToFormValues(unit?: Unit | null): UnitFormValues {
  return { code: unit?.code ?? '', name: unit?.name ?? '', allows_decimal: unit?.allows_decimal ?? false }
}
