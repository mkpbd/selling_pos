import { z } from 'zod'
import { optionalText } from '@/shared/validation/common'
import { isDecimalString, normalizeDecimal, QUANTITY_SCALE, toUnits } from '@/shared/utils/decimal'
import { ADJUSTMENT_REASONS, ADJUSTMENT_TYPES, type AdjustmentInput, type AdjustmentReason, type AdjustmentType } from '../types'

/** Reasons offered per type; the first one is the default. */
export const REASONS_BY_TYPE: Record<AdjustmentType, readonly AdjustmentReason[]> = {
  in: ['received', 'opening', 'returned', 'correction', 'other'],
  out: ['damaged', 'expired', 'lost', 'correction', 'other'],
  count: ['correction', 'opening', 'other'],
}

/** Validates a quantity input against the unit's decimal rule. */
export function quantityIssue(value: string, allowsDecimal: boolean, { allowZero }: { allowZero: boolean }): string | null {
  const v = value.trim()
  if (v === '') return 'Quantity is required.'
  if (v.startsWith('-')) return 'Quantity cannot be negative.'
  if (!isDecimalString(v, 20)) return 'Enter a valid number.'
  // Trailing zeros don't count: "2.000" is a whole number.
  const significantDecimals = (v.split('.')[1] ?? '').replace(/0+$/, '').length
  if (!allowsDecimal && significantDecimals > 0) return 'This unit only allows whole numbers.'
  if (significantDecimals > QUANTITY_SCALE) return 'Use at most 3 decimal places.'
  if (!allowZero && (toUnits(v, QUANTITY_SCALE) ?? 0n) <= 0n) return 'Quantity must be greater than zero.'
  return null
}

export function createAdjustmentSchema(allowsDecimal: boolean) {
  return z
    .object({
      type: z.enum(ADJUSTMENT_TYPES),
      quantity: z.string(),
      reason: z.enum(ADJUSTMENT_REASONS, { error: 'Select a reason.' }),
      note: optionalText(500, 'Note'),
    })
    .superRefine((data, ctx) => {
      const issue = quantityIssue(data.quantity, allowsDecimal, { allowZero: data.type === 'count' })
      if (issue) ctx.addIssue({ code: 'custom', path: ['quantity'], message: issue })
    })
    .transform((data) => ({ ...data, quantity: normalizeDecimal(data.quantity, QUANTITY_SCALE) ?? '0.000' }))
}

export type AdjustmentFormValues = z.input<ReturnType<typeof createAdjustmentSchema>>
export type AdjustmentFormOutput = z.output<ReturnType<typeof createAdjustmentSchema>>

const _contract = (v: AdjustmentFormOutput & { product_id: string }): AdjustmentInput => v
void _contract

export function createReorderLevelSchema(allowsDecimal: boolean) {
  return z
    .object({ reorder_level: z.string() })
    .superRefine((data, ctx) => {
      const issue = quantityIssue(data.reorder_level, allowsDecimal, { allowZero: true })
      if (issue) ctx.addIssue({ code: 'custom', path: ['reorder_level'], message: issue.replace('Quantity', 'Reorder level') })
    })
    .transform((data) => ({ reorder_level: normalizeDecimal(data.reorder_level, QUANTITY_SCALE) ?? '0.000' }))
}
export type ReorderLevelFormValues = z.input<ReturnType<typeof createReorderLevelSchema>>
export type ReorderLevelFormOutput = z.output<ReturnType<typeof createReorderLevelSchema>>
