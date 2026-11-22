import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useActiveBranchId } from '@/shared/hooks/useActiveBranchId'
import { isApiError } from '@/shared/services/http'
import { inventoryApi, inventoryKeys } from '../api/inventory.api'
import type { AdjustmentInput, MovementListParams, StockListParams } from '../types'

export function useStockList(params: StockListParams) {
  const branchId = useActiveBranchId()
  return useQuery({
    queryKey: inventoryKeys.stockList(branchId, params),
    queryFn: ({ signal }) => inventoryApi.stock(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useStockSummary(options: { enabled?: boolean } = {}) {
  const branchId = useActiveBranchId()
  return useQuery({
    queryKey: inventoryKeys.summary(branchId),
    queryFn: ({ signal }) => inventoryApi.summary(signal),
    enabled: options.enabled ?? true,
  })
}

export function useMovements(params: MovementListParams, options: { enabled?: boolean } = {}) {
  const branchId = useActiveBranchId()
  return useQuery({
    queryKey: inventoryKeys.movements(branchId, params),
    queryFn: ({ signal }) => inventoryApi.movements(params, signal),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  })
}

function useInvalidateInventory() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
}

export interface AdjustVariables {
  input: AdjustmentInput
  idempotencyKey: string
}

export function useAdjustStock() {
  const invalidate = useInvalidateInventory()
  return useMutation({
    mutationFn: ({ input, idempotencyKey }: AdjustVariables) => inventoryApi.adjust(input, idempotencyKey),
    // Safe to auto-retry transient failures: the same idempotency key is reused,
    // so the server applies the adjustment at most once.
    retry: (failureCount, error) => failureCount < 1 && isApiError(error) && (error.status === 0 || error.status >= 500),
    retryDelay: 600,
    onSuccess: () => void invalidate(),
  })
}

export function useSetReorderLevel() {
  const invalidate = useInvalidateInventory()
  return useMutation({
    mutationFn: ({ productId, reorderLevel }: { productId: string; reorderLevel: string }) =>
      inventoryApi.setReorderLevel(productId, reorderLevel),
    onSuccess: () => void invalidate(),
  })
}
