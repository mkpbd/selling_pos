import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Boxes, FunnelX, History, MoreHorizontal, ScrollText, SlidersHorizontal, Target } from 'lucide-react'
import { usePermission } from '@/modules/authentication'
import { DataTable, type DataTableColumn } from '@/shared/components/data-table'
import { PageHeader } from '@/shared/components/PageHeader'
import { SearchInput } from '@/shared/components/SearchInput'
import { SortSelect, type SortOption } from '@/shared/components/SortSelect'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { ToggleGroup, ToggleGroupItem } from '@/shared/components/ui/toggle-group'
import { PERMISSIONS } from '@/shared/constants/permissions'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { useListParams } from '@/shared/hooks/useListParams'
import { formatMoney, formatQuantity, isZeroDecimal } from '@/shared/utils/decimal'
import { formatDateTime, formatRelative } from '@/shared/utils/format'
import { AdjustStockDialog } from '../components/AdjustStockDialog'
import { ReorderLevelDialog } from '../components/ReorderLevelDialog'
import { StockHistorySheet } from '../components/StockHistorySheet'
import { StockStatusBadge } from '../components/StockStatusBadge'
import { StockSummaryCards } from '../components/StockSummaryCards'
import { STOCK_STATUS_LABELS } from '../constants'
import { useStockList } from '../hooks/useInventory'
import type { StockItem, StockListParams, StockStatus } from '../types'

const STATUSES: StockStatus[] = ['in_stock', 'low_stock', 'out_of_stock']
const isStatus = (v: string | undefined): v is StockStatus => STATUSES.includes(v as StockStatus)

const SORT_OPTIONS: SortOption[] = [
  { value: 'name', label: 'Name (A–Z)' },
  { value: '-name', label: 'Name (Z–A)' },
  { value: 'sku', label: 'SKU (A–Z)' },
  { value: 'quantity', label: 'Quantity (low → high)' },
  { value: '-quantity', label: 'Quantity (high → low)' },
]

type Panel = { kind: 'adjust' | 'reorder' | 'history'; item: StockItem } | null

export function StockPage() {
  useDocumentTitle('Inventory')
  const list = useListParams<'status'>({ filterKeys: ['status'] })
  const canAdjust = usePermission(PERMISSIONS.INVENTORY_ADJUST)
  const [panel, setPanel] = useState<Panel>(null)
  const [lastPanel, setLastPanel] = useState<NonNullable<Panel> | null>(null)
  const status = isStatus(list.filters.status) ? list.filters.status : undefined

  const open = (kind: NonNullable<Panel>['kind'], item: StockItem) => {
    const next = { kind, item }
    setPanel(next)
    setLastPanel(next)
  }
  // Keep the item mounted while the dialog/sheet animates out.
  const shown = panel ?? lastPanel

  const params = useMemo<StockListParams>(
    () => ({ page: list.page, per_page: list.perPage, search: list.search || undefined, sort: list.sort, status }),
    [list.page, list.perPage, list.search, list.sort, status],
  )
  const query = useStockList(params)

  const columns = useMemo<DataTableColumn<StockItem>[]>(
    () => [
      {
        id: 'name',
        header: 'Product',
        sortField: 'name',
        cell: (s) => (
          <div className="min-w-0">
            <p className="max-w-64 truncate font-medium">{s.name}</p>
            <p className="font-mono text-xs text-muted-foreground">{s.sku}</p>
          </div>
        ),
      },
      {
        id: 'quantity',
        header: 'On hand',
        sortField: 'quantity',
        headerClassName: 'text-right',
        className: 'text-right',
        cell: (s) => (
          <span className="tabular-nums">
            <span className="text-base font-semibold">{formatQuantity(s.quantity)}</span>
            <span className="ml-1 text-xs text-muted-foreground">{s.unit.code}</span>
          </span>
        ),
      },
      { id: 'status', header: 'Status', cell: (s) => <StockStatusBadge status={s.status} /> },
      {
        id: 'reorder',
        header: 'Reorder at',
        hideOnMobile: true,
        headerClassName: 'text-right',
        className: 'text-right tabular-nums text-muted-foreground',
        cell: (s) => (isZeroDecimal(s.reorder_level) ? '—' : formatQuantity(s.reorder_level)),
      },
      {
        id: 'value',
        header: 'Stock value',
        hideOnMobile: true,
        headerClassName: 'text-right',
        className: 'text-right tabular-nums',
        cell: (s) => formatMoney(s.stock_value),
      },
      {
        id: 'last',
        header: 'Last movement',
        hideOnMobile: true,
        cell: (s) =>
          s.last_movement_at ? (
            <time dateTime={s.last_movement_at} title={formatDateTime(s.last_movement_at)} className="text-xs text-muted-foreground">
              {formatRelative(s.last_movement_at)}
            </time>
          ) : (
            <span className="text-xs text-muted-foreground">Never</span>
          ),
      },
      {
        id: 'actions',
        header: <span className="sr-only">Actions</span>,
        headerClassName: 'w-12',
        className: 'text-right',
        cell: (s) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${s.name}`}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="truncate">{s.sku}</DropdownMenuLabel>
              {canAdjust && (
                <>
                  <DropdownMenuItem onSelect={() => open('adjust', s)}>
                    <SlidersHorizontal aria-hidden="true" />
                    Adjust stock
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => open('reorder', s)}>
                    <Target aria-hidden="true" />
                    Set reorder level
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onSelect={() => open('history', s)}>
                <History aria-hidden="true" />
                View history
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [canAdjust],
  )

  const closePanel = (isOpen: boolean) => !isOpen && setPanel(null)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        icon={Boxes}
        description="On-hand stock for the active branch. Adjust, count and track every movement."
        actions={
          <Button variant="outline" asChild>
            <Link to="/inventory/movements">
              <ScrollText data-icon="inline-start" />
              Movement ledger
            </Link>
          </Button>
        }
      />

      <StockSummaryCards activeStatus={status} onSelectStatus={(s) => list.setFilter('status', s)} />

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <ToggleGroup
          type="single"
          variant="outline"
          value={status ?? 'all'}
          onValueChange={(v) => v && list.setFilter('status', v === 'all' ? undefined : v)}
          aria-label="Filter by stock status"
          className="w-full overflow-x-auto sm:w-auto"
        >
          <ToggleGroupItem value="all" className="flex-1 sm:flex-none">
            All
          </ToggleGroupItem>
          {STATUSES.map((s) => (
            <ToggleGroupItem key={s} value={s} className="flex-1 whitespace-nowrap sm:flex-none">
              {STOCK_STATUS_LABELS[s]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <SearchInput value={list.search} onChange={list.setSearch} placeholder="Search SKU, name, barcode…" aria-label="Search stock" />
        <SortSelect value={list.sort} onChange={list.setSort} options={SORT_OPTIONS} defaultLabel="Name (default)" />
        {list.hasActiveFilters && (
          <Button variant="ghost" onClick={list.reset}>
            <FunnelX data-icon="inline-start" />
            Clear
          </Button>
        )}
      </div>

      <DataTable
        caption="Stock levels"
        columns={columns}
        data={query.data?.items}
        getRowId={(s) => s.product_id}
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
            ? { title: 'Nothing matches', description: 'Try another status or search term.', icon: FunnelX }
            : {
                title: 'No stock-tracked products',
                description: 'Products with “Track stock” turned on appear here.',
                icon: Boxes,
                action: (
                  <Button variant="outline" asChild>
                    <Link to="/products">Go to products</Link>
                  </Button>
                ),
              }
        }
      />

      <AdjustStockDialog open={panel?.kind === 'adjust'} onOpenChange={closePanel} item={shown?.kind === 'adjust' ? shown.item : null} />
      <ReorderLevelDialog open={panel?.kind === 'reorder'} onOpenChange={closePanel} item={shown?.kind === 'reorder' ? shown.item : null} />
      <StockHistorySheet open={panel?.kind === 'history'} onOpenChange={closePanel} item={shown?.kind === 'history' ? shown.item : null} />
    </div>
  )
}

export default StockPage
