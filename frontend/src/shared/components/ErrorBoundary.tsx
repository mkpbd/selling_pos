import { Component, type ErrorInfo, type ReactNode } from 'react'
import { House, RefreshCw, TriangleAlert } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

interface ErrorFallbackProps {
  error: unknown
  onReset?: () => void
}

export function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  const message = error instanceof Error ? error.message : String(error)
  return (
    <div role="alert" className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive ring-1 ring-destructive/20">
        <TriangleAlert className="size-8" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        An unexpected error occurred while rendering this page. You can try again, or head back to the dashboard.
      </p>
      {import.meta.env.DEV && message && (
        <pre className="mt-4 max-w-xl overflow-auto rounded-lg bg-muted px-4 py-3 text-left font-mono text-xs text-muted-foreground">
          {message}
        </pre>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button onClick={() => (onReset ? onReset() : window.location.reload())}>
          <RefreshCw data-icon="inline-start" />
          Try again
        </Button>
        <Button variant="outline" asChild>
          <a href="/dashboard">
            <House data-icon="inline-start" />
            Go to dashboard
          </a>
        </Button>
      </div>
    </div>
  )
}

interface ErrorBoundaryProps {
  children: ReactNode
  /** Changing any key resets the boundary (e.g. the current pathname). */
  resetKeys?: unknown[]
  fallback?: (props: ErrorFallbackProps) => ReactNode
}

interface ErrorBoundaryState {
  error: unknown
  hasError: boolean
  resetKeys: unknown[]
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, hasError: false, resetKeys: this.props.resetKeys ?? [] }

  static getDerivedStateFromError(error: unknown): Partial<ErrorBoundaryState> {
    return { error, hasError: true }
  }

  static getDerivedStateFromProps(
    props: ErrorBoundaryProps,
    state: ErrorBoundaryState,
  ): Partial<ErrorBoundaryState> | null {
    const next = props.resetKeys ?? []
    const changed = next.length !== state.resetKeys.length || next.some((key, i) => !Object.is(key, state.resetKeys[i]))
    if (!changed) return null
    return state.hasError ? { error: null, hasError: false, resetKeys: next } : { resetKeys: next }
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    // Hook for an error-reporting service (Sentry, etc.).
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  private reset = () => this.setState({ error: null, hasError: false })

  render(): ReactNode {
    if (this.state.hasError) {
      const props = { error: this.state.error, onReset: this.reset }
      return this.props.fallback ? this.props.fallback(props) : <ErrorFallback {...props} />
    }
    return this.props.children
  }
}
