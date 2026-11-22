import { QueryClient } from '@tanstack/react-query'
import { isApiError } from '@/shared/services/http'

/** Retry transient failures only (network errors, 5xx), never 4xx. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false
  if (!isApiError(error)) return true
  return error.status === 0 || error.status >= 500
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: shouldRetry,
        refetchOnWindowFocus: true,
      },
      mutations: {
        retry: false,
      },
    },
  })
}
