import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { ArrowDown, ArrowUp, ArrowUpDown, type LucideIcon } from 'lucide-react'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { parseSort } from '@/shared/hooks/useListParams'
import type { PaginationMeta } from '@/shared/services/http'
import { cn } from '@/shared/utils/cn'
import { EmptyState } from '../EmptyState'
import { ErrorState } from '../ErrorState'
import { TablePagination } from './TablePagination'

export interface DataTableColumn<T> {
  id: string
  header: ReactNode
  cell: (row: T) => ReactNode
  /** Server sort field; makes the header clickable. */
  sortField?: string
  className?: string
  headerClassName?: string
  /** Hide below the `md` breakpoint to keep mobile tables readable. */
  hideOnMobile?: boolean
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[] | undefined
  getRowId: (row: T) => string | number
  isLoading: boolean
  /** Background refetch (e.g. page change with placeholder data). */
  isFetching?: boolean
  error?: unknown
  onRetry?: () => void
  sort?: string
  onSortChange?: (field: string) => void
  pagination?: PaginationMeta
  onPageChange?: (page: number) => void
  onPageSizeChange?: (perPage: number) => void
  empty?: { title: string; description?: ReactNode; icon?: LucideIcon; action?: ReactNode }
  skeletonRows?: number
  caption: string
  className?: string
}

const rowMotion = {
  hidden: { opacity: 0, y: 4 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: Math.min(i, 12) * 0.025, duration: 0.2 } }),
}

function SortIcon({ direction }: { direction: 'asc' | 'desc' | null }) {
  if (direction === 'asc') return <ArrowUp className="size-3.5" aria-hidden="true" />
  if (direction === 'desc') return <ArrowDown className="size-3.5" aria-hidden="true" />
  return <ArrowUpDown className="size-3.5 opacity-40 group-hover/sort:opacity-80" aria-hidden="true" />
}

export function DataTable<T>({
  columns,
  data,
  getRowId,
  isLoading,
  isFetching = false,
  error,
  onRetry,
  sort,
  onSortChange,
  pagination,
  onPageChange,
  onPageSizeChange,
  empty,
  skeletonRows = 6,
  caption,
  className,
}: DataTableProps<T>) {
  const parsedSort = parseSort(sort)
  const rows = data ?? []
  const showError = Boolean(error) && rows.length === 0
  const showEmpty = !isLoading && !showError && rows.length === 0

  const responsive = (col: DataTableColumn<T>) => (col.hideOnMobile ? 'hidden md:table-cell' : undefined)

  return (
    <div className={cn('overflow-hidden rounded-xl border bg-card shadow-xs', className)}>
      <div className="relative">
        {isFetching && !isLoading && (
          <div
            className="absolute inset-x-0 top-0 z-10 h-0.5 animate-pulse bg-primary/60"
            role="progressbar"
            aria-label="Refreshing"
          />
        )}
        <Table aria-busy={isLoading || isFetching}>
          <caption className="sr-only">{caption}</caption>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              {columns.map((col) => {
                const active = parsedSort && parsedSort.field === col.sortField ? parsedSort.direction : null
                const ariaSort = active === 'asc' ? 'ascending' : active === 'desc' ? 'descending' : 'none'
                return (
                  <TableHead
                    key={col.id}
                    scope="col"
                    aria-sort={col.sortField ? ariaSort : undefined}
                    className={cn('h-10 px-4 text-xs font-medium tracking-wide text-muted-foreground uppercase', responsive(col), col.headerClassName)}
                  >
                    {col.sortField && onSortChange ? (
                      <button
                        type="button"
                        onClick={() => onSortChange(col.sortField as string)}
                        className="group/sort -mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 uppercase transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {col.header}
                        <SortIcon direction={active} />
                      </button>
                    ) : (
                      col.header
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: skeletonRows }, (_, i) => (
                <TableRow key={`skeleton-${i}`} className="hover:bg-transparent">
                  {columns.map((col, c) => (
                    <TableCell key={col.id} className={cn('px-4 py-3.5', responsive(col))}>
                      <Skeleton className={cn('h-4', c === 0 ? 'w-40' : 'w-24')} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading &&
              rows.map((row, index) => (
                <motion.tr
                  key={getRowId(row)}
                  data-slot="table-row"
                  variants={rowMotion}
                  initial="hidden"
                  animate="show"
                  custom={index}
                  className={cn(
                    'border-b transition-colors hover:bg-muted/50',
                    isFetching && 'opacity-70',
                  )}
                >
                  {columns.map((col) => (
                    <TableCell key={col.id} className={cn('px-4 py-3', responsive(col), col.className)}>
                      {col.cell(row)}
                    </TableCell>
                  ))}
                </motion.tr>
              ))}

            {(showError || showEmpty) && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="p-0">
                  {showError ? (
                    <ErrorState error={error} onRetry={onRetry} />
                  ) : (
                    <EmptyState
                      title={empty?.title ?? 'No records found'}
                      description={empty?.description}
                      icon={empty?.icon}
                      action={empty?.action}
                    />
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {pagination && onPageChange && pagination.total > 0 && (
        <TablePagination
          pagination={pagination}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          disabled={isFetching}
        />
      )}
    </div>
  )
}
