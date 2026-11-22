import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { PAGE_SIZE_OPTIONS } from '@/shared/constants/pagination'
import type { PaginationMeta } from '@/shared/services/http'

interface TablePaginationProps {
  pagination: PaginationMeta
  onPageChange: (page: number) => void
  onPageSizeChange?: (perPage: number) => void
  disabled?: boolean
}

export function TablePagination({ pagination, onPageChange, onPageSizeChange, disabled }: TablePaginationProps) {
  const { page, per_page: perPage, total, last_page: lastPage } = pagination
  const from = total === 0 ? 0 : (page - 1) * perPage + 1
  const to = Math.min(page * perPage, total)
  const canPrev = page > 1 && !disabled
  const canNext = page < lastPage && !disabled

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col-reverse items-center justify-between gap-3 border-t px-4 py-3 text-sm sm:flex-row"
    >
      <p className="text-muted-foreground" aria-live="polite">
        Showing <span className="font-medium text-foreground">{from.toLocaleString()}</span>–
        <span className="font-medium text-foreground">{to.toLocaleString()}</span> of{' '}
        <span className="font-medium text-foreground">{total.toLocaleString()}</span>
      </p>
      <div className="flex items-center gap-4">
        {onPageSizeChange && (
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-muted-foreground" id="rows-per-page-label">
              Rows
            </span>
            <Select value={String(perPage)} onValueChange={(v) => onPageSizeChange(Number(v))} disabled={disabled}>
              <SelectTrigger size="sm" className="w-18" aria-labelledby="rows-per-page-label">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <span className="text-muted-foreground tabular-nums">
          Page {page} of {Math.max(lastPage, 1)}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            className="hidden sm:inline-flex"
            onClick={() => onPageChange(1)}
            disabled={!canPrev}
            aria-label="First page"
          >
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(page - 1)}
            disabled={!canPrev}
            aria-label="Previous page"
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(page + 1)}
            disabled={!canNext}
            aria-label="Next page"
          >
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            className="hidden sm:inline-flex"
            onClick={() => onPageChange(lastPage)}
            disabled={!canNext}
            aria-label="Last page"
          >
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </nav>
  )
}
