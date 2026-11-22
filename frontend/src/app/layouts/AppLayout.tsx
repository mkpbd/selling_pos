import { motion } from 'motion/react'
import { Outlet, useLocation, useNavigation } from 'react-router'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { SidebarInset, SidebarProvider } from '@/shared/components/ui/sidebar'
import { AppSidebar } from './components/AppSidebar'
import { Topbar } from './components/Topbar'

function RouteProgress() {
  const navigation = useNavigation()
  if (navigation.state === 'idle') return null
  return (
    <div className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden" role="progressbar" aria-label="Loading page">
      <div className="h-full w-1/3 animate-[route-progress_1s_ease-in-out_infinite] bg-primary" />
    </div>
  )
}

/** Authenticated shell: collapsible sidebar (sheet on mobile), topbar, animated content. */
export function AppLayout() {
  const { pathname } = useLocation()
  return (
    <SidebarProvider>
      <RouteProgress />
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <AppSidebar />
      <SidebarInset>
        <Topbar />
        <main id="main-content" tabIndex={-1} className="flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8">
          <ErrorBoundary resetKeys={[pathname]}>
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto w-full max-w-7xl"
            >
              <Outlet />
            </motion.div>
          </ErrorBoundary>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
