import type { ListParams } from '@/shared/types'

/** `Unit` (products contract §2). */
export interface Unit {
  id: string
  code: string
  name: string
  allows_decimal: boolean
  products_count: number
  created_at: string
  updated_at: string
}

export interface UnitInput {
  code: string
  name: string
  allows_decimal: boolean
}

/** `Category` (products contract §3). */
export interface Category {
  id: string
  name: string
  description: string | null
  is_active: boolean
  products_count: number
  created_at: string
  updated_at: string
}

export interface CategoryInput {
  name: string
  description: string | null
  is_active: boolean
}

export interface ProductUnitRef {
  id: string
  code: string
  name: string
  allows_decimal: boolean
}

/** `Product` (products contract §4). Money/percent fields are decimal strings. */
export interface Product {
  id: string
  sku: string
  barcode: string | null
  name: string
  description: string | null
  category: { id: string; name: string } | null
  unit: ProductUnitRef
  cost_price: string
  selling_price: string
  tax_rate: string
  margin_percent: string | null
  track_stock: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductInput {
  sku: string
  barcode: string | null
  name: string
  description: string | null
  category_id: string | null
  unit_id: string
  cost_price: string
  selling_price: string
  tax_rate: string
  track_stock: boolean
  is_active: boolean
}

export interface ProductListParams extends ListParams {
  category_id?: string
  is_active?: boolean
}
