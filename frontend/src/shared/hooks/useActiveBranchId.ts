import { useSyncExternalStore } from 'react'
import { getActiveBranchId, subscribeActiveBranch } from '@/shared/services/branch-context'

/** Reactive read of the persisted active branch id. */
export function useActiveBranchId(): string | null {
  return useSyncExternalStore(subscribeActiveBranch, getActiveBranchId, () => null)
}
