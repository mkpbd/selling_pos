import { Separator } from '@/shared/components/ui/separator'
import { SidebarTrigger } from '@/shared/components/ui/sidebar'
import { AppBreadcrumbs } from './AppBreadcrumbs'
import { BranchSwitcher } from './BranchSwitcher'
import { ThemeToggle } from './ThemeToggle'
import { UserMenu } from './UserMenu'

export function Topbar() {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 sm:px-4 md:rounded-t-xl">
      <SidebarTrigger className="-ml-1" aria-label="Toggle sidebar" />
      <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
      <div className="min-w-0 flex-1">
        <AppBreadcrumbs />
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <BranchSwitcher />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  )
}
