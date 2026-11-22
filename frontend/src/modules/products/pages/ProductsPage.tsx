import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Barcode, Check, FunnelX, Minus, Package, Pencil, Plus, Settings2 } from 'lucide-react'
import { Can, usePermission } from '@/modules/authentication'
import { DataTable, type DataTableColumn } from '@/shared/components/data-table'
import { PageHeader } from '@/shared/components/PageHeader'
import { SearchInput } from '@/shared/components/SearchInput'
import { SortSelect, type SortOption } from '@/shared/components/SortSelect'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { StatusFilter } from '@/shared/components/StatusFilter'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { PERMISSIONS } from '@/shared/constants/permissions'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { useListParams } from '@/shared/hooks/useListParams'
import { cn } from '@/shared/utils/cn'
import { formatMoney, formatPercent } from '@/shared/utils/decimal'
import { formatDate } from '@/shared/utils/format'
import { parseBooleanFilter } from '@/shared/utils/filters'
import { ProductFormSheet } from '../components/ProductFormSheet'
import { useCategories } from '../hooks/useCatalog'
import { useProductList } from '../hooks/useProducts'
import type { Product, ProductListParams } from '../types'

const ALL = '__all__'

const SORT_OPTIONS: SortOption[] = [
  { value: 'name', label: 'Name (A–Z)' },
  { value: '-name', label: 'Name (Z–A)' },
  { value: 'sku', label: 'SKU (A–Z)' },
  { value: '-sku', label: 'SKU (Z–A)' },
  { value: 'selling_price', label: 'Price (low → high)' },
  { value: '-selling_price', label: 'Price (high → low)' },
  { value: '-created_at', label: 'Newest first' },
  { value: 'created_at', label: 'Oldest first' },
]

export function ProductsPage() {
  useDocumentTitle('Products')
  const list = useListParams<'is_active' | 'category_id'>({ filterKeys: ['is_active', 'category_id'] })
  const canUpdate = usePermission(PERMISSIONS.PRODUCTS_UPDATE)
  const categories = useCategories()
  const [sheet, setSheet] = useState<{ open: boolean; product: Product | null }>({ open: false, product: null })

  const params = useMemo<ProductListParams>(
    () => ({
      page: list.page,
      per_page: list.perPage,
      search: list.search || undefined,
      sort: list.sort,
      category_id: list.filters.category_id,
      is_active: parseBooleanFilter(list.filters.is_active),
    }),
    [list.page, list.perPage, list.search, list.sort, list.filters.category_id, list.filters.is_active],
  )
  const query = useProductList(params)

  const money = 'text-right tabular-nums'
  const columns = useMemo<DataTableColumn<Product>[]>(
    () => [
      {
        id: 'name',
        header: 'Product',
        sortField: 'name',
        cell: (p) => (
          <div className="min-w-0">
            <p className="max-w-64 truncate font-medium">{p.name}</p>
            <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
              <span className="font-mono">{p.sku}</span>
              {p.barcode && (
                <span className="inline-flex items-center gap-1 font-mono">
                  <Barcode className="size-3" aria-hidden="true" />
                  <span className="sr-only">Barcode</span>
                  {p.barcode}
                </span>
              )}
            </p>
          </div>
        ),
      },
      {
        id: 'category',
        header: 'Category',
        hideOnMobile: true,
        cell: (p) =>
          p.category ? <Badge variant="secondary">{p.category.name}</Badge> : <span className="text-muted-foreground">—</span>,
      },
      {
        id: 'unit',
        header: 'Unit',
        hideOnMobile: true,
        cell: (p) => (
          <span className="font-mono text-xs" title={p.unit.name}>
            {p.unit.code}
          </span>
        ),
      },
      { id: 'cost', header: 'Cost', hideOnMobile: true, headerClassName: 'text-right', className: money, cell: (p) => formatMoney(p.cost_price) },
      {
        id: 'selling_price',
        header: 'Price',
        sortField: 'selling_price',
        headerClassName: 'text-right',
        className: cn(money, 'font-medium'),
        cell: (p) => formatMoney(p.selling_price),
      },
      {
        id: 'margin',
        header: 'Margin',
        hideOnMobile: true,
        headerClassName: 'text-right',
        className: money,
        cell: (p) => (
          <span className={cn(p.margin_percent?.startsWith('-') ? 'text-destructive' : 'text-success')}>
            {formatPercent(p.margin_percent)}
          </span>
        ),
      },
      { id: 'tax', header: 'Tax', hideOnMobile: true, headerClassName: 'text-right', className: money, cell: (p) => formatPercent(p.tax_rate) },
      {
        id: 'track',
        header: <span title="Stock tracked">Stock</span>,
        hideOnMobile: true,
        cell: (p) =>
          p.track_stock ? (
            <Check className="size-4 text-success" aria-label="Stock tracked" />
          ) : (
            <Minus className="size-4 text-muted-foreground" aria-label="Not stock tracked" />
          ),
      },
      { id: 'status', header: 'Status', cell: (p) => <StatusBadge active={p.is_active} /> },
      {
        id: 'created_at',
        header: 'Added',
        sortField: 'created_at',
        hideOnMobile: true,
        cell: (p) => <span className="text-xs text-muted-foreground">{formatDate(p.created_at)}</span>,
      },
      {
        id: 'actions',
        header: <span className="sr-only">Actions</span>,
        headerClassName: 'w-12',
        className: 'text-right',
        cell: (p) =>
          canUpdate ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`Edit ${p.name}`} onClick={() => setSheet({ open: true, product: p })}>
                  <Pencil />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>
          ) : null,
      },
    ],
    [canUpdate],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        icon={Package}
        description="Your catalogue: what you sell, how it's priced and whether stock is tracked."
        actions={
          <>
            <Can permission={PERMISSIONS.CATALOG_MANAGE}>
              <Button variant="outline" asChild>
                <Link to="/products/catalog">
                  <Settings2 data-icon="inline-start" />
                  Catalog settings
                </Link>
              </Button>
            </Can>
            <Can permission={PERMISSIONS.PRODUCTS_CREATE}>
              <Button onClick={() => setSheet({ open: true, product: null })}>
                <Plus data-icon="inline-start" />
                New product
              </Button>
            </Can>
          </>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput value={list.search} onChange={list.setSearch} placeholder="Search SKU, name, barcode…" aria-label="Search products" />
        <Select
          value={list.filters.category_id ?? ALL}
          onValueChange={(v) => list.setFilter('category_id', v === ALL ? undefined : v)}
        >
          <SelectTrigger className="w-full sm:w-48" aria-label="Filter by category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {categories.data?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
                {!c.is_active && ' (inactive)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <StatusFilter value={list.filters.is_active} onChange={(v) => list.setFilter('is_active', v)} />
        <SortSelect value={list.sort} onChange={list.setSort} options={SORT_OPTIONS} />
        {list.hasActiveFilters && (
          <Button variant="ghost" onClick={list.reset}>
            <FunnelX data-icon="inline-start" />
            Clear
          </Button>
        )}
      </div>

      <DataTable
        caption="Products"
        columns={columns}
        data={query.data?.items}
        getRowId={(p) => p.id}
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
            ? { title: 'No matching products', description: 'Try a different search or clear the filters.', icon: FunnelX }
            : { title: 'No products yet', description: 'Add your first product to start selling.', icon: Package }
        }
      />

      <ProductFormSheet open={sheet.open} product={sheet.product} onOpenChange={(open) => setSheet((s) => ({ ...s, open }))} />
    </div>
  )
}

export default ProductsPage
