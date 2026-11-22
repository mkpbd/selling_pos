import { z } from 'zod'
import { isDecimalString, MONEY_SCALE, normalizeDecimal, PERCENT_SCALE, toUnits } from '@/shared/utils/decimal'

/** Money input: "1,250.5" → "1250.50"; must be ≥ 0 with at most 2 decimals. */
export function moneyField(label = 'Amount') {
  return z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .refine((v) => !v.trim().startsWith('-'), `${label} must be zero or more.`)
    .refine((v) => v.trim().startsWith('-') || isDecimalString(v, MONEY_SCALE), `${label} must be a number with up to 2 decimals.`)
    .transform((v) => normalizeDecimal(v, MONEY_SCALE) as string)
}

/** Percentage input 0–100 with at most 2 decimals → "5.00". */
export function percentField(label = 'Percentage') {
  return z
    .string()
    .trim()
    .transform((v) => (v === '' ? '0' : v))
    .refine((v) => isDecimalString(v, PERCENT_SCALE), `${label} must be a number with up to 2 decimals.`)
    .refine((v) => (toUnits(v, PERCENT_SCALE) ?? 0n) <= 10_000n, `${label} must be between 0 and 100.`)
    .transform((v) => normalizeDecimal(v, PERCENT_SCALE) as string)
}
