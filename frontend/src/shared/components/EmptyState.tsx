import type { ReactNode } from 'react'
import { Inbox, type LucideIcon } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

interface EmptyStateProps {
  title: string
  description?: ReactNode
  icon?: LucideIcon
  action?: ReactNode
  className?: string
  tone?: 'default' | 'destructive'
}

/** Friendly placeholder with a layered icon illustration. */
export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
  tone = 'default',
}: EmptyStateProps) {
  const destructive = tone === 'destructive'
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      <div aria-hidden="true" className="relative mb-5">
        <div
          className={cn(
            'absolute inset-0 -m-3 rounded-full blur-xl',
            destructive ? 'bg-destructive/15' : 'bg-primary/15',
          )}
        />
        <div className="relative flex size-16 items-center justify-center rounded-2xl border bg-card shadow-sm">
          <div
            className={cn(
              'absolute -top-1.5 -right-1.5 size-4 rounded-full border-2 border-card',
              destructive ? 'bg-destructive/70' : 'bg-primary/70',
            )}
          />
          <Icon className={cn('size-7', destructive ? 'text-destructive' : 'text-primary')} />
        </div>
        <div className="absolute -bottom-2 left-1/2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-foreground/5" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
