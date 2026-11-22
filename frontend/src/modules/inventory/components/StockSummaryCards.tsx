import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { Link } from 'react-router'
import { Boxes, CircleCheck, CircleX, TriangleAlert, Wallet, type LucideIcon } from 'lucide-react'
import { ErrorState } from '@/shared/components/ErrorState'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/utils/cn'
import { formatMoney } from '@/shared/utils/decimal'
import { useStockSummary } from '../hooks/useInventory'
import type { StockStatus, StockSummary } from '../types'

export type SummaryMetric = 'tracked_products' | StockStatus | 'stock_value'

interface MetricDef {
  label: string
  icon: LucideIcon
  tone: string
  status?: StockStatus
  value: (s: StockSummary) => string
  hint?: string
}

const METRICS: Record<SummaryMetric, MetricDef> = {
  tracked_products: {
    label: 'Tracked products',
    icon: Boxes,
    tone: 'bg-primary/10 text-primary ring-primary/20',
    value: (s) => s.tracked_products.toLocaleString(),
  },
  in_stock: {
    label: 'In stock',
    icon: CircleCheck,
    tone: 'bg-success/10 text-success ring-success/20',
    status: 'in_stock',
    value: (s) => s.in_stock.toLocaleString(),
  },
  low_stock: {
    label: 'Low stock',
    icon: TriangleAlert,
    tone: 'bg-warning/15 text-warning-foreground ring-warning/30 dark:text-warning',
    status: 'low_stock',
    value: (s) => s.low_stock.toLocaleString(),
    hint: 'At or below reorder level',
  },
  out_of_stock: {
    label: 'Out of stock',
    icon: CircleX,
    tone: 'bg-destructive/10 text-destructive ring-destructive/20',
    status: 'out_of_stock',
    value: (s) => s.out_of_stock.toLocaleString(),
  },
  stock_value: {
    label: 'Stock value',
    icon: Wallet,
    tone: 'bg-chart-4/10 text-chart-4 ring-chart-4/20',
    value: (s) => formatMoney(s.stock_value),
    hint: 'At current cost price',
  },
}

const ALL_METRICS: SummaryMetric[] = ['tracked_products', 'in_stock', 'low_stock', 'out_of_stock', 'stock_value']

interface StockSummaryCardsProps {
  metrics?: SummaryMetric[]
  /** Status cards become toggle buttons for filtering. */
  onSelectStatus?: (status: StockStatus | undefined) => void
  activeStatus?: StockStatus
  /** Status cards become links (e.g. from the dashboard). */
  linkBase?: string
  className?: string
}

/** KPI cards from GET /inventory/summary (active branch). */
export function StockSummaryCards({
  metrics = ALL_METRICS,
  onSelectStatus,
  activeStatus,
  linkBase,
  className,
}: StockSummaryCardsProps) {
  const summary = useStockSummary()
  const grid = cn('grid gap-3', metrics.length >= 5 ? 'grid-cols-2 lg:grid-cols-5' : 'grid-cols-1 sm:grid-cols-3', className)

  if (summary.isPending) {
    return (
      <div className={grid} role="status" aria-label="Loading stock summary">
        {metrics.map((m) => (
          <Skeleton key={m} className="h-24 rounded-xl" />
        ))}
      </div>
    )
  }
  if (summary.error) {
    return <ErrorState error={summary.error} onRetry={() => void summary.refetch()} title="Couldn't load stock summary" />
  }

  const data = summary.data
  return (
    <ul className={grid} aria-label="Stock summary">
      {metrics.map((key, index) => {
        const def = METRICS[key]
        const Icon = def.icon
        const active = def.status !== undefined && def.status === activeStatus
        const body: ReactNode = (
          <>
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground">{def.label}</p>
              <span className={cn('flex size-8 items-center justify-center rounded-lg ring-1 transition-transform group-hover:scale-110', def.tone)}>
                <Icon className="size-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 truncate text-2xl font-bold tracking-tight tabular-nums">{def.value(data)}</p>
            {def.hint && <p className="mt-0.5 truncate text-[0.7rem] text-muted-foreground">{def.hint}</p>}
          </>
        )
        const cardClass = cn(
          'group block h-full rounded-xl border bg-card p-4 text-left shadow-xs transition-all',
          (onSelectStatus || linkBase) && def.status && 'hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          active && 'border-primary ring-2 ring-primary/20',
        )

        let card: ReactNode = <div className={cardClass}>{body}</div>
        if (def.status && onSelectStatus) {
          card = (
            <button
              type="button"
              className={cn(cardClass, 'w-full')}
              aria-pressed={active}
              onClick={() => onSelectStatus(active ? undefined : def.status)}
            >
              {body}
            </button>
          )
        } else if (def.status && linkBase) {
          card = (
            <Link to={`${linkBase}?status=${def.status}`} className={cardClass}>
              {body}
            </Link>
          )
        } else if (linkBase) {
          card = (
            <Link to={linkBase} className={cn(cardClass, 'hover:-translate-y-0.5 hover:shadow-md')}>
              {body}
            </Link>
          )
        }

        return (
          <motion.li
            key={key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.25, ease: 'easeOut' }}
            className={cn('list-none', key === 'stock_value' && metrics.length >= 5 && 'col-span-2 lg:col-span-1')}
          >
            {card}
          </motion.li>
        )
      })}
    </ul>
  )
}
