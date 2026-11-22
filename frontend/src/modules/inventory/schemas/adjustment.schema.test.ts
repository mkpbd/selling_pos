import { describe, expect, it } from 'vitest'
import { createAdjustmentSchema, createReorderLevelSchema, type AdjustmentFormValues } from './adjustment.schema'

const base: AdjustmentFormValues = { type: 'in', quantity: '5', reason: 'received', note: '' }

const quantityErrors = (allowsDecimal: boolean, values: Partial<AdjustmentFormValues>) => {
  const result = createAdjustmentSchema(allowsDecimal).safeParse({ ...base, ...values })
  return result.success ? [] : result.error.issues.filter((i) => i.path[0] === 'quantity').map((i) => i.message)
}

describe('adjustment schema', () => {
  it('normalizes quantity to 3 decimals and empty note to null', () => {
    expect(createAdjustmentSchema(false).parse(base)).toEqual({ type: 'in', quantity: '5.000', reason: 'received', note: null })
    expect(createAdjustmentSchema(true).parse({ ...base, quantity: '0.25' }).quantity).toBe('0.250')
  })

  it('requires whole numbers when the unit does not allow decimals', () => {
    expect(quantityErrors(false, { quantity: '1.5' })).toContain('This unit only allows whole numbers.')
    expect(quantityErrors(false, { quantity: '2.000' })).toEqual([])
    expect(quantityErrors(true, { quantity: '1.5' })).toEqual([])
  })

  it('allows at most 3 decimals for decimal units', () => {
    expect(quantityErrors(true, { quantity: '0.0005' })).toContain('Use at most 3 decimal places.')
    expect(quantityErrors(true, { quantity: '0.001' })).toEqual([])
  })

  it('requires quantity > 0 for in and out', () => {
    for (const type of ['in', 'out'] as const) {
      expect(quantityErrors(false, { type, quantity: '0' })).toContain('Quantity must be greater than zero.')
      expect(quantityErrors(false, { type, quantity: '' })).toContain('Quantity is required.')
      expect(quantityErrors(false, { type, quantity: '-3' })).toContain('Quantity cannot be negative.')
    }
  })

  it('allows zero for a count (the counted on-hand quantity)', () => {
    expect(quantityErrors(false, { type: 'count', reason: 'correction', quantity: '0' })).toEqual([])
    expect(quantityErrors(false, { type: 'count', reason: 'correction', quantity: '-1' })).toHaveLength(1)
  })

  it('rejects unknown reasons and notes over 500 characters', () => {
    const schema = createAdjustmentSchema(false)
    expect(schema.safeParse({ ...base, reason: 'stolen' }).success).toBe(false)
    expect(schema.safeParse({ ...base, note: 'x'.repeat(501) }).success).toBe(false)
  })

  it('validates reorder levels (≥ 0, unit decimal rule)', () => {
    expect(createReorderLevelSchema(false).parse({ reorder_level: '10' })).toEqual({ reorder_level: '10.000' })
    expect(createReorderLevelSchema(false).safeParse({ reorder_level: '0' }).success).toBe(true)
    expect(createReorderLevelSchema(false).safeParse({ reorder_level: '2.5' }).success).toBe(false)
    expect(createReorderLevelSchema(true).parse({ reorder_level: '2.5' })).toEqual({ reorder_level: '2.500' })
  })
})
