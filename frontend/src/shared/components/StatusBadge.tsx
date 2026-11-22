import { Badge } from '@/shared/components/ui/badge'
import { cn } from '@/shared/utils/cn'

export function StatusBadge({ active, className }: { active: boolean; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 font-medium',
        active ? 'border-success/30 bg-success/10 text-success' : 'border-border bg-muted text-muted-foreground',
        className,
      )}
    >
      <span aria-hidden="true" className={cn('size-1.5 rounded-full', active ? 'bg-success' : 'bg-muted-foreground/60')} />
      {active ? 'Active' : 'Inactive'}
    </Badge>
  )
}
