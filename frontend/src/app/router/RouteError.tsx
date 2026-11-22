import { isRouteErrorResponse, useRouteError } from 'react-router'
import { ErrorFallback } from '@/shared/components/ErrorBoundary'
import { NotFoundView } from '@/shared/components/StatusViews'

/** Router-level error element (render errors, failed lazy chunks, 404 responses). */
export function RouteError() {
  const error = useRouteError()
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundView />

  // A failed dynamic import usually means a new deployment replaced old chunks.
  const chunkFailed = error instanceof Error && /dynamically imported module|Importing a module script failed/i.test(error.message)

  return (
    <div className="min-h-svh bg-background">
      <ErrorFallback
        error={chunkFailed ? new Error('A new version of the app is available. Reload to continue.') : error}
        onReset={() => window.location.reload()}
      />
    </div>
  )
}
