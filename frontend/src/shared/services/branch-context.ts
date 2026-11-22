import { STORAGE_KEYS } from '@/shared/constants/storage-keys'

/**
 * Active branch store. Persisted to localStorage so the choice survives reloads,
 * and read synchronously by the HTTP client to send the `X-Branch-Id` header.
 */
type Listener = () => void

const listeners = new Set<Listener>()

function readStored(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEYS.activeBranch)
  } catch {
    return null
  }
}

let activeBranchId: string | null = typeof window === 'undefined' ? null : readStored()

export function getActiveBranchId(): string | null {
  return activeBranchId
}

export function setActiveBranchId(id: string | null): void {
  if (id === activeBranchId) return
  activeBranchId = id
  try {
    if (id) window.localStorage.setItem(STORAGE_KEYS.activeBranch, id)
    else window.localStorage.removeItem(STORAGE_KEYS.activeBranch)
  } catch {
    // Storage unavailable (private mode, blocked site data): keep the in-memory value.
  }
  listeners.forEach((listener) => listener())
}

export function subscribeActiveBranch(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
