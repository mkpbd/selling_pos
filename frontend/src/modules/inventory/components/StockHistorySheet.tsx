import { useState } from 'react'
import { motion } from 'motion/react'
import { Link } from 'react-router'
import { ExternalLink, History } from 'lucide-react'
import { EmptyState } from '@/shared/components/EmptyState'
import { ErrorState } from '@/shared/components/ErrorState'
import { TablePagination } from '@/shared/components/data-table'
import { Button } from '@/shared/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { formatQuantity } from '@/shared/utils/decimal'
import { formatDateTime, formatRelative } from '@/shared/utils/format'
import { reasonLabel } from '../constants'
import { useMovements } from '../hooks/useInventory'
import type { StockItem } from '../types'
import { MovementQuantity, MovementTypeBadge } from './MovementBits'

interface StockHistorySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: StockItem | null
}

const PAGE_SIZE = 15

export function StockHistorySheet({ open, onOpenChange, item }: StockHistorySheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-lg">
        {item && <HistoryList key={item.product_id} item={item} enabled={open} />}
      </SheetContent>
    </Sheet>
  )
}

function HistoryList({ item, enabled }: { item: StockItem; enabled: boolean }) {
  const [page, setPage] = useState(1)
  const query = useMovements({ product_id: item.product_id, page, per_page: PAGE_SIZE }, { enabled })
  const rows = query.data?.items ?? []

  return (
    <>
      <SheetHeader className="border-b">
        <SheetTitle className="flex items-center gap-2">
          <History className="size-4 text-primary" aria-hidden="true" />
          Stock history
        </SheetTitle>
        <SheetDescription>
          {item.name} · <span className="font-mono">{item.sku}</span> · On hand{' '}
          <span className="font-semibold text-foreground">
            {formatQuantity(item.quantity)} {item.unit.code}
          </span>
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto">
        {query.isPending ? (
          <div className="space-y-3 p-4" role="status" aria-label="Loading movements">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : query.error && rows.length === 0 ? (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState icon={History} title="No movements yet" description="Adjustments for this product will appear here." />
        ) : (
          <ol className="divide-y" aria-label="Stock movements, newest first">
            {rows.map((m, i) => (
              <motion.li
                key={m.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i, 10) * 0.03, duration: 0.2 }}
                className="flex items-start justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <MovementTypeBadge type={m.type} />
                    <span className="text-sm">{reasonLabel(m.reason)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <time dateTime={m.created_at} title={formatDateTime(m.created_at)}>
                      {formatRelative(m.created_at)}
                    </time>
                    {m.user && <> · {m.user.name}</>}
                  </p>
                  {m.note && <p className="text-xs text-muted-foreground italic">“{m.note}”</p>}
                </div>
                <div className="shrink-0 text-right">
                  <MovementQuantity value={m.quantity} />
                  <p className="text-xs text-muted-foreground tabular-nums">Balance {formatQuantity(m.balance_after)}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        )}
      </div>

      {query.data && query.data.pagination.total > PAGE_SIZE && (
        <TablePagination pagination={query.data.pagination} onPageChange={setPage} disabled={query.isFetching} />
      )}
      <div className="border-t p-3">
        <Button variant="ghost" size="sm" asChild className="w-full">
          <Link to={`/inventory/movements?product_id=${encodeURIComponent(item.product_id)}`}>
            Open in movement ledger
            <ExternalLink data-icon="inline-end" />
          </Link>
        </Button>
      </div>
    </>
  )
}
