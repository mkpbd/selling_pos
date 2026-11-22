import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/shared/constants/pagination'

export type SortDirection = 'asc' | 'desc'

export interface ListState<F extends string> {
  page: number
  perPage: number
  search: string
  sort: string | undefined
  filters: Partial<Record<F, string>>
}

export interface UseListParamsOptions<F extends string> {
  filterKeys?: readonly F[]
  defaultSort?: string
  defaultPerPage?: number
}

function toPositiveInt(value: string | null, fallback: number, max = Number.MAX_SAFE_INTEGER): number {
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? Math.min(n, max) : fallback
}

/** Parses a `sort` value into field + direction (`-name` means name desc). */
export function parseSort(sort: string | undefined): { field: string; direction: SortDirection } | null {
  if (!sort) return null
  return sort.startsWith('-') ? { field: sort.slice(1), direction: 'desc' } : { field: sort, direction: 'asc' }
}

/** Cycles asc, then desc, then off for a column. */
export function nextSort(current: string | undefined, field: string): string | undefined {
  const parsed = parseSort(current)
  if (!parsed || parsed.field !== field) return field
  if (parsed.direction === 'asc') return `-${field}`
  return undefined
}

/**
 * List state (page, page size, search, sort, filters) kept in the URL query string,
 * so tables are shareable and survive reloads.
 */
export function useListParams<F extends string = never>(options: UseListParamsOptions<F> = {}) {
  const { filterKeys = [], defaultSort, defaultPerPage = DEFAULT_PAGE_SIZE } = options
  const [searchParams, setSearchParams] = useSearchParams()
  const filterKeyList = filterKeys.join(',')

  const state = useMemo<ListState<F>>(() => {
    const filters: Partial<Record<F, string>> = {}
    for (const key of filterKeyList ? (filterKeyList.split(',') as F[]) : []) {
      const value = searchParams.get(key)
      if (value) filters[key] = value
    }
    return {
      page: toPositiveInt(searchParams.get('page'), 1),
      perPage: toPositiveInt(searchParams.get('per_page'), defaultPerPage, MAX_PAGE_SIZE),
      search: searchParams.get('search') ?? '',
      sort: searchParams.get('sort') ?? defaultSort,
      filters,
    }
  }, [searchParams, filterKeyList, defaultSort, defaultPerPage])

  const update = useCallback(
    (patch: Record<string, string | number | undefined>, resetPage = true) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [key, value] of Object.entries(patch)) {
            if (value === undefined || value === '') next.delete(key)
            else next.set(key, String(value))
          }
          if (resetPage && !('page' in patch)) next.delete('page')
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const actions = useMemo(
    () => ({
      setPage: (page: number) => update({ page: page > 1 ? page : undefined }, false),
      setPerPage: (perPage: number) => update({ per_page: perPage === defaultPerPage ? undefined : perPage }),
      setSearch: (search: string) => update({ search: search.trim() || undefined }),
      // Clearing the sort falls back to `defaultSort` (if any).
      setSort: (sort: string | undefined) => update({ sort: sort === defaultSort ? undefined : sort }),
      toggleSort: (field: string) => {
        const next = nextSort(state.sort, field)
        update({ sort: next === defaultSort ? undefined : next })
      },
      setFilter: (key: F, value: string | undefined) => update({ [key]: value }),
      reset: () => setSearchParams(new URLSearchParams(), { replace: true }),
    }),
    [update, defaultPerPage, defaultSort, state.sort, setSearchParams],
  )

  const hasActiveFilters = Boolean(state.search) || Object.keys(state.filters).length > 0

  return { ...state, ...actions, hasActiveFilters }
}
