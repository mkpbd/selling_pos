import { ArrowDownLeft, ArrowUpRight, ClipboardCheck, Repeat } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { cn } from '@/shared/utils/cn'
import { formatSignedQuantity, toUnits, QUANTITY_SCALE } from '@/shared/utils/decimal'
import { movementTypeLabel } from '../constants'
import type { MovementType } from '../types'

/** Signed quantity: green for additions, red for removals. */
export function MovementQuantity({ value, unit, className }: { value: string; unit?: string; className?: string }) {
  const units = toUnits(value, QUANTITY_SCALE) ?? 0n
  return (
    <span
      className={cn(
        'font-semibold tabular-nums',
        units > 0n ? 'text-success' : units < 0n ? 'text-destructive' : 'text-muted-foreground',
        className,
      )}
    >
      {formatSignedQuantity(value)}
      {unit && <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>}
      <span className="sr-only">{units > 0n ? ' added' : units < 0n ? ' removed' : ''}</span>
    </span>
  )
}

const TYPE_ICON: Record<string, typeof Repeat> = {
  adjustment_in: ArrowDownLeft,
  adjustment_out: ArrowUpRight,
  count: ClipboardCheck,
}

export function MovementTypeBadge({ type }: { type: MovementType }) {
  const Icon = TYPE_ICON[type] ?? Repeat
  return (
    <Badge variant="secondary" className="gap-1 font-normal">
      <Icon className="size-3" aria-hidden="true" />
      {movementTypeLabel(type)}
    </Badge>
  )
}
