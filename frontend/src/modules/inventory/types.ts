import type { ListParams } from '@/shared/types'

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock'

/** `StockItem` (products/inventory contract §5). Quantities are 3-dp strings, money 2-dp strings. */
export interface StockItem {
  product_id: string
  sku: string
  name: string
  barcode: string | null
  unit: { code: string; allows_decimal: boolean }
  quantity: string
  reorder_level: string
  status: StockStatus
  stock_value: string
  last_movement_at: string | null
}

export interface StockSummary {
  tracked_products: number
  in_stock: number
  low_stock: number
  out_of_stock: number
  stock_value: string
}

export interface StockListParams extends ListParams {
  status?: StockStatus
}

export const ADJUSTMENT_TYPES = ['in', 'out', 'count'] as const
export type AdjustmentType = (typeof ADJUSTMENT_TYPES)[number]

export const ADJUSTMENT_REASONS = [
  'opening',
  'received',
  'damaged',
  'expired',
  'lost',
  'returned',
  'correction',
  'other',
] as const
export type AdjustmentReason = (typeof ADJUSTMENT_REASONS)[number]

export interface AdjustmentInput {
  product_id: string
  type: AdjustmentType
  quantity: string
  reason: AdjustmentReason
  note: string | null
}

/** Current types plus ones future modules will add (sales, purchases, transfers). */
export type MovementType =
  | 'adjustment_in'
  | 'adjustment_out'
  | 'count'
  | 'sale'
  | 'sale_return'
  | 'purchase'
  | 'transfer_in'
  | 'transfer_out'
  | (string & {})

export interface Movement {
  id: string
  product_id: string
  sku: string
  product_name: string
  type: MovementType
  reason: string | null
  /** Signed: positive adds stock, negative removes it. */
  quantity: string
  balance_after: string
  note: string | null
  user: { id: string; name: string } | null
  created_at: string
}

export interface AdjustmentResult {
  movement: Movement
  stock: StockItem
}

export interface MovementListParams extends ListParams {
  product_id?: string
  type?: string
  /** YYYY-MM-DD, inclusive */
  from?: string
  to?: string
}
