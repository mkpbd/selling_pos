import { humanize } from '@/shared/utils/format'
import type { AdjustmentReason, AdjustmentType, MovementType, StockStatus } from './types'

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  in_stock: 'In stock',
  low_stock: 'Low stock',
  out_of_stock: 'Out of stock',
}

export const REASON_LABELS: Record<AdjustmentReason, string> = {
  opening: 'Opening stock',
  received: 'Goods received',
  damaged: 'Damaged',
  expired: 'Expired',
  lost: 'Lost / stolen',
  returned: 'Customer return',
  correction: 'Correction',
  other: 'Other',
}

export const ADJUSTMENT_TYPE_META: Record<AdjustmentType, { label: string; hint: string }> = {
  in: { label: 'Stock in', hint: 'Add units: deliveries, returns, opening stock.' },
  out: { label: 'Stock out', hint: 'Remove units: damage, expiry, loss.' },
  count: { label: 'Stock count', hint: 'Enter what you physically counted; we record the difference.' },
}

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  adjustment_in: 'Stock in',
  adjustment_out: 'Stock out',
  count: 'Stock count',
  sale: 'Sale',
  sale_return: 'Sale return',
  purchase: 'Purchase',
  transfer_in: 'Transfer in',
  transfer_out: 'Transfer out',
}

/** Movement types users can currently filter by (future modules will add more). */
export const FILTERABLE_MOVEMENT_TYPES = ['adjustment_in', 'adjustment_out', 'count'] as const

export function movementTypeLabel(type: MovementType): string {
  return MOVEMENT_TYPE_LABELS[type] ?? humanize(type)
}

export function reasonLabel(reason: string | null): string {
  if (!reason) return '—'
  return (REASON_LABELS as Record<string, string>)[reason] ?? humanize(reason)
}
