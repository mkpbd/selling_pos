import { CircleCheck, CircleX, TriangleAlert } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { cn } from '@/shared/utils/cn'
import { STOCK_STATUS_LABELS } from '../constants'
import type { StockStatus } from '../types'

const STYLES: Record<StockStatus, { className: string; icon: typeof CircleCheck }> = {
  in_stock: { className: 'border-success/30 bg-success/10 text-success', icon: CircleCheck },
  low_stock: { className: 'border-warning/40 bg-warning/15 text-warning-foreground dark:text-warning', icon: TriangleAlert },
  out_of_stock: { className: 'border-destructive/30 bg-destructive/10 text-destructive', icon: CircleX },
}

/** Green / amber / red stock status with an icon, so colour isn't the only signal. */
export function StockStatusBadge({ status, className }: { status: StockStatus; className?: string }) {
  const { className: tone, icon: Icon } = STYLES[status] ?? STYLES.in_stock
  return (
    <Badge variant="outline" data-status={status} className={cn('gap-1 font-medium', tone, className)}>
      <Icon className="size-3" aria-hidden="true" />
      {STOCK_STATUS_LABELS[status] ?? status}
    </Badge>
  )
}
