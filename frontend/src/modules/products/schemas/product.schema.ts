import { z } from 'zod'
import { optionalText } from '@/shared/validation/common'
import { moneyField, percentField } from '@/shared/validation/decimal'
import type { Product, ProductInput } from '../types'

export const skuSchema = z
  .string()
  .trim()
  .transform((v) => v.toUpperCase())
  .pipe(
    z
      .string()
      .min(2, 'SKU must be at least 2 characters.')
      .max(40, 'SKU may not be greater than 40 characters.')
      .regex(/^[A-Z0-9._-]+$/, 'SKU may only contain letters, numbers, dots, dashes and underscores.'),
  )

export const barcodeSchema = z
  .string()
  .trim()
  .refine((v) => v === '' || (v.length >= 4 && v.length <= 64), 'Barcode must be between 4 and 64 characters.')
  .refine((v) => v === '' || /^[A-Za-z0-9-]+$/.test(v), 'Barcode may only contain letters, numbers and dashes.')
  .transform((v) => (v === '' ? null : v))

export const productSchema = z.object({
  sku: skuSchema,
  barcode: barcodeSchema,
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(150, 'Name may not be greater than 150 characters.'),
  description: optionalText(2000, 'Description'),
  category_id: z
    .string()
    .nullable()
    .transform((v) => (v ? v : null)),
  unit_id: z.string().min(1, 'Select a unit.'),
  cost_price: moneyField('Cost price'),
  selling_price: moneyField('Selling price'),
  tax_rate: percentField('Tax rate'),
  track_stock: z.boolean(),
  is_active: z.boolean(),
})

export type ProductFormValues = z.input<typeof productSchema>
export type ProductFormOutput = z.output<typeof productSchema>

// Compile-time check: the schema output is exactly the API payload.
const _contract = (v: ProductFormOutput): ProductInput => v
void _contract

export const PRODUCT_FORM_FIELDS = [
  'sku',
  'barcode',
  'name',
  'description',
  'category_id',
  'unit_id',
  'cost_price',
  'selling_price',
  'tax_rate',
  'track_stock',
  'is_active',
] as const

export function productToFormValues(product?: Product | null): ProductFormValues {
  return {
    sku: product?.sku ?? '',
    barcode: product?.barcode ?? '',
    name: product?.name ?? '',
    description: product?.description ?? '',
    category_id: product?.category?.id ?? null,
    unit_id: product?.unit.id ?? '',
    cost_price: product?.cost_price ?? '',
    selling_price: product?.selling_price ?? '',
    tax_rate: product?.tax_rate ?? '0',
    track_stock: product?.track_stock ?? true,
    is_active: product?.is_active ?? true,
  }
}
