import { useMemo } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, FunnelX, ScrollText, X } from 'lucide-react'
import { DataTable, type DataTableColumn } from '@/shared/components/data-table'
import { PageHeader } from '@/shared/components/PageHeader'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { useListParams } from '@/shared/hooks/useListParams'
import { formatQuantity } from '@/shared/utils/decimal'
import { formatDateTime, formatRelative } from '@/shared/utils/format'
import { MovementQuantity, MovementTypeBadge } from '../components/MovementBits'
import { FILTERABLE_MOVEMENT_TYPES, movementTypeLabel, reasonLabel } from '../constants'
import { useMovements } from '../hooks/useInventory'
import type { Movement, MovementListParams } from '../types'

const ALL = '__all__'
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const validDate = (v: string | undefined) => (v && DATE_RE.test(v) ? v : undefined)

export function MovementsPage() {
  useDocumentTitle('Stock movements')
  const list = useListParams<'type' | 'from' | 'to' | 'product_id'>({ filterKeys: ['type', 'from', 'to', 'product_id'] })
  const from = validDate(list.filters.from)
  const to = validDate(list.filters.to)
  const rangeInvalid = Boolean(from && to && from > to)

  const params = useMemo<MovementListParams>(
    () => ({
      page: list.page,
      per_page: list.perPage,
      sort: list.sort,
      type: list.filters.type,
      product_id: list.filters.product_id,
      from,
      to: rangeInvalid ? undefined : to,
    }),
    [list.page, list.perPage, list.sort, list.filters.type, list.filters.product_id, from, to, rangeInvalid],
  )
  const query = useMovements(params)
  const productLabel = list.filters.product_id ? query.data?.items[0] : undefined

  const columns = useMemo<DataTableColumn<Movement>[]>(
    () => [
      {
        id: 'created_at',
        header: 'When',
        sortField: 'created_at',
        cell: (m) => (
          <div className="text-xs">
            <time dateTime={m.created_at} className="font-medium text-foreground">
              {formatDateTime(m.created_at)}
            </time>
            <p className="text-muted-foreground">{formatRelative(m.created_at)}</p>
          </div>
        ),
      },
      {
        id: 'product',
        header: 'Product',
        cell: (m) => (
          <div className="min-w-0">
            <p className="max-w-56 truncate font-medium">{m.product_name}</p>
            <p className="font-mono text-xs text-muted-foreground">{m.sku}</p>
          </div>
        ),
      },
      { id: 'type', header: 'Type', hideOnMobile: true, cell: (m) => <MovementTypeBadge type={m.type} /> },
      {
        id: 'reason',
        header: 'Reason',
        hideOnMobile: true,
        cell: (m) => (
          <div className="min-w-0">
            <p className="text-sm">{reasonLabel(m.reason)}</p>
            {m.note && <p className="max-w-48 truncate text-xs text-muted-foreground" title={m.note}>{m.note}</p>}
          </div>
        ),
      },
      {
        id: 'quantity',
        header: 'Change',
        headerClassName: 'text-right',
        className: 'text-right',
        cell: (m) => <MovementQuantity value={m.quantity} />,
      },
      {
        id: 'balance',
        header: 'Balance',
        headerClassName: 'text-right',
        className: 'text-right tabular-nums',
        cell: (m) => formatQuantity(m.balance_after),
      },
      { id: 'user', header: 'By', hideOnMobile: true, cell: (m) => <span className="text-sm">{m.user?.name ?? 'System'}</span> },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock movements"
        icon={ScrollText}
        description="Append-only ledger of every stock change in the active branch."
        actions={
          <Button variant="outline" asChild>
            <Link to="/inventory">
              <ArrowLeft data-icon="inline-start" />
              Back to stock
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="grid gap-1.5">
          <Label htmlFor="movement-type">Type</Label>
          <Select value={list.filters.type ?? ALL} onValueChange={(v) => list.setFilter('type', v === ALL ? undefined : v)}>
            <SelectTrigger id="movement-type" className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All types</SelectItem>
              {FILTERABLE_MOVEMENT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {movementTypeLabel(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <div className="grid gap-1.5">
            <Label htmlFor="movement-from">From</Label>
            <Input
              id="movement-from"
              type="date"
              value={from ?? ''}
              max={to}
              onChange={(e) => list.setFilter('from', e.target.value || undefined)}
              className="sm:w-40"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="movement-to">To</Label>
            <Input
              id="movement-to"
              type="date"
              value={to ?? ''}
              min={from}
              onChange={(e) => list.setFilter('to', e.target.value || undefined)}
              className="sm:w-40"
              aria-invalid={rangeInvalid || undefined}
              aria-describedby={rangeInvalid ? 'movement-range-error' : undefined}
            />
          </div>
        </div>
        {list.filters.product_id && (
          <Badge variant="secondary" className="h-8 gap-1.5 pr-1 text-sm">
            Product: {productLabel ? `${productLabel.sku}` : 'selected'}
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Clear product filter"
              onClick={() => list.setFilter('product_id', undefined)}
            >
              <X />
            </Button>
          </Badge>
        )}
        {list.hasActiveFilters && (
          <Button variant="ghost" onClick={list.reset}>
            <FunnelX data-icon="inline-start" />
            Clear filters
          </Button>
        )}
      </div>
      {rangeInvalid && (
        <p id="movement-range-error" role="alert" className="-mt-3 text-sm text-destructive">
          “From” must be on or before “To”. The end date is ignored until fixed.
        </p>
      )}

      <DataTable
        caption="Stock movements"
        columns={columns}
        data={query.data?.items}
        getRowId={(m) => m.id}
        isLoading={query.isPending}
        isFetching={query.isFetching}
        error={query.error}
        onRetry={() => void query.refetch()}
        sort={list.sort}
        onSortChange={list.toggleSort}
        pagination={query.data?.pagination}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPerPage}
        empty={
          list.hasActiveFilters
            ? { title: 'No movements match', description: 'Try a different type or date range.', icon: FunnelX }
            : { title: 'No movements yet', description: 'Stock adjustments will be recorded here.', icon: ScrollText }
        }
      />
    </div>
  )
}

export default MovementsPage
