import { describe, expect, it } from 'vitest'
import { productSchema, type ProductFormValues } from './product.schema'

const valid: ProductFormValues = {
  sku: ' coke-500 ',
  barcode: '',
  name: 'Coca-Cola 500ml',
  description: '',
  category_id: null,
  unit_id: 'unit-1',
  cost_price: '35',
  selling_price: '1,045.5',
  tax_rate: '5',
  track_stock: true,
  is_active: true,
}

const errorsFor = (values: Partial<ProductFormValues>, field: string) => {
  const result = productSchema.safeParse({ ...valid, ...values })
  return result.success ? [] : result.error.issues.filter((i) => i.path[0] === field).map((i) => i.message)
}

describe('productSchema', () => {
  it('normalizes SKU, money, tax and empty optionals into the API payload', () => {
    expect(productSchema.parse(valid)).toEqual({
      sku: 'COKE-500',
      barcode: null,
      name: 'Coca-Cola 500ml',
      description: null,
      category_id: null,
      unit_id: 'unit-1',
      cost_price: '35.00',
      selling_price: '1045.50',
      tax_rate: '5.00',
      track_stock: true,
      is_active: true,
    })
  })

  it.each([
    ['A', 'SKU must be at least 2 characters.'],
    ['X'.repeat(41), 'SKU may not be greater than 40 characters.'],
    ['COKE 500', 'SKU may only contain letters, numbers, dots, dashes and underscores.'],
    ['COKE/500', 'SKU may only contain letters, numbers, dots, dashes and underscores.'],
  ])('rejects SKU %j', (sku, message) => {
    expect(errorsFor({ sku }, 'sku')).toContain(message)
  })

  it('accepts SKUs with dots, dashes and underscores', () => {
    expect(productSchema.parse({ ...valid, sku: 'ab.c_d-1' }).sku).toBe('AB.C_D-1')
  })

  it('requires prices to be ≥ 0 with at most 2 decimals', () => {
    expect(errorsFor({ cost_price: '-1' }, 'cost_price')).toContain('Cost price must be zero or more.')
    expect(errorsFor({ selling_price: '' }, 'selling_price')).toContain('Selling price is required.')
    expect(errorsFor({ selling_price: '10.999' }, 'selling_price')).toHaveLength(1)
    expect(errorsFor({ selling_price: 'abc' }, 'selling_price')).toHaveLength(1)
    expect(productSchema.parse({ ...valid, cost_price: '0', selling_price: '0' })).toMatchObject({
      cost_price: '0.00',
      selling_price: '0.00',
    })
  })

  it('limits tax to 0–100 and defaults blank to 0', () => {
    expect(errorsFor({ tax_rate: '100.01' }, 'tax_rate')).toContain('Tax rate must be between 0 and 100.')
    expect(errorsFor({ tax_rate: '-5' }, 'tax_rate')).toHaveLength(1)
    expect(productSchema.parse({ ...valid, tax_rate: '100' }).tax_rate).toBe('100.00')
    expect(productSchema.parse({ ...valid, tax_rate: '' }).tax_rate).toBe('0.00')
  })

  it('validates barcode length and characters, and requires a unit', () => {
    expect(errorsFor({ barcode: '123' }, 'barcode')).toContain('Barcode must be between 4 and 64 characters.')
    expect(errorsFor({ barcode: '1234 5678' }, 'barcode')).toHaveLength(1)
    expect(productSchema.parse({ ...valid, barcode: 'ab-1234' }).barcode).toBe('ab-1234')
    expect(errorsFor({ unit_id: '' }, 'unit_id')).toContain('Select a unit.')
  })
})
