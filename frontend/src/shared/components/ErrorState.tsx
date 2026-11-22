import { RefreshCw, ServerCrash, WifiOff } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { ERROR_CODES } from '@/shared/constants/error-codes'
import { normalizeError } from '@/shared/services/http'
import { EmptyState } from './EmptyState'

interface ErrorStateProps {
  error: unknown
  onRetry?: () => void
  title?: string
  className?: string
}

export function ErrorState({ error, onRetry, title, className }: ErrorStateProps) {
  const apiError = normalizeError(error)
  const offline = apiError.code === ERROR_CODES.NETWORK_ERROR
  return (
    <EmptyState
      className={className}
      tone="destructive"
      icon={offline ? WifiOff : ServerCrash}
      title={title ?? (offline ? 'You appear to be offline' : 'Something went wrong')}
      description={
        <>
          {apiError.message}
          {apiError.requestId && (
            <span className="mt-1 block font-mono text-xs opacity-70">Ref: {apiError.requestId}</span>
          )}
        </>
      }
      action={
        onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw data-icon="inline-start" />
            Try again
          </Button>
        )
      }
    />
  )
}
