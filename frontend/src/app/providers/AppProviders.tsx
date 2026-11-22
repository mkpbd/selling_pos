import { useState, type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { MotionConfig } from 'motion/react'
import { AuthProvider } from '@/modules/authentication'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { Toaster } from '@/shared/components/ui/sonner'
import { TooltipProvider } from '@/shared/components/ui/tooltip'
import { createQueryClient } from './query-client'
import { useTheme } from './theme-context'
import { ThemeProvider } from './ThemeProvider'

function ThemedToaster() {
  const { resolvedTheme } = useTheme()
  return <Toaster theme={resolvedTheme} position="top-right" richColors closeButton />
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          {/* Honour the OS "reduce motion" setting for every motion component. */}
          <MotionConfig reducedMotion="user">
            <TooltipProvider delayDuration={300}>
              <AuthProvider>{children}</AuthProvider>
              <ThemedToaster />
            </TooltipProvider>
          </MotionConfig>
          {import.meta.env.DEV && <ReactQueryDevtools buttonPosition="bottom-left" />}
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
