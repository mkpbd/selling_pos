import { api } from '@/shared/services/http'
import type {
  AdjustmentInput,
  AdjustmentResult,
  Movement,
  MovementListParams,
  StockItem,
  StockListParams,
  StockSummary,
} from '../types'

export const IDEMPOTENCY_HEADER = 'Idempotency-Key'

/**
 * Inventory data is branch-scoped, so keys include the active branch id:
 * switching branches never shows another branch's cached numbers.
 */
export const inventoryKeys = {
  all: ['inventory'] as const,
  branch: (branchId: string | null) => [...inventoryKeys.all, branchId ?? 'default'] as const,
  stockLists: (branchId: string | null) => [...inventoryKeys.branch(branchId), 'stock'] as const,
  stockList: (branchId: string | null, params: StockListParams) => [...inventoryKeys.stockLists(branchId), params] as const,
  summary: (branchId: string | null) => [...inventoryKeys.branch(branchId), 'summary'] as const,
  movementLists: (branchId: string | null) => [...inventoryKeys.branch(branchId), 'movements'] as const,
  movements: (branchId: string | null, params: MovementListParams) => [...inventoryKeys.movementLists(branchId), params] as const,
}

export const inventoryApi = {
  stock: (params: StockListParams, signal?: AbortSignal) => api.getPaginated<StockItem>('/inventory/stock', { params, signal }),
  stockItem: (productId: string, signal?: AbortSignal) => api.get<StockItem>(`/inventory/stock/${productId}`, { signal }),
  summary: (signal?: AbortSignal) => api.get<StockSummary>('/inventory/summary', { signal }),
  setReorderLevel: (productId: string, reorderLevel: string) =>
    api.put<StockItem>(`/inventory/stock/${productId}/reorder-level`, { reorder_level: reorderLevel }),
  /** Critical write: the caller supplies one idempotency key per submission and reuses it on retry. */
  adjust: (input: AdjustmentInput, idempotencyKey: string) =>
    api.post<AdjustmentResult>('/inventory/adjustments', input, { headers: { [IDEMPOTENCY_HEADER]: idempotencyKey } }),
  movements: (params: MovementListParams, signal?: AbortSignal) =>
    api.getPaginated<Movement>('/inventory/movements', { params, signal }),
}
