import { useMemo, useState } from 'react'
import { Building2, FunnelX, Mail, Pencil, Phone, Plus } from 'lucide-react'
import { Can, usePermission } from '@/modules/authentication'
import { DataTable, type DataTableColumn } from '@/shared/components/data-table'
import { PageHeader } from '@/shared/components/PageHeader'
import { SearchInput } from '@/shared/components/SearchInput'
import { StatusFilter } from '@/shared/components/StatusFilter'
import { parseBooleanFilter } from '@/shared/utils/filters'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { PERMISSIONS } from '@/shared/constants/permissions'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { useListParams } from '@/shared/hooks/useListParams'
import { formatDate } from '@/shared/utils/format'
import { BranchFormDialog } from '../components/BranchFormDialog'
import { useBranchList } from '../hooks/useBranches'
import type { Branch, BranchListParams } from '../types'

export function BranchesPage() {
  useDocumentTitle('Branches')
  const list = useListParams<'is_active'>({ filterKeys: ['is_active'] })
  const canUpdate = usePermission(PERMISSIONS.BRANCHES_UPDATE)
  const [dialog, setDialog] = useState<{ open: boolean; branch: Branch | null }>({ open: false, branch: null })

  const params = useMemo<BranchListParams>(
    () => ({
      page: list.page,
      per_page: list.perPage,
      search: list.search || undefined,
      sort: list.sort,
      is_active: parseBooleanFilter(list.filters.is_active),
    }),
    [list.page, list.perPage, list.search, list.sort, list.filters.is_active],
  )
  const query = useBranchList(params)

  const columns = useMemo<DataTableColumn<Branch>[]>(
    () => [
      {
        id: 'code',
        header: 'Code',
        sortField: 'code',
        cell: (b) => (
          <Badge variant="secondary" className="font-mono tracking-wide">
            {b.code}
          </Badge>
        ),
      },
      {
        id: 'name',
        header: 'Name',
        sortField: 'name',
        cell: (b) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{b.name}</p>
            {b.address && <p className="max-w-xs truncate text-xs text-muted-foreground">{b.address}</p>}
          </div>
        ),
      },
      {
        id: 'contact',
        header: 'Contact',
        hideOnMobile: true,
        cell: (b) =>
          b.phone || b.email ? (
            <div className="space-y-0.5 text-xs text-muted-foreground">
              {b.phone && (
                <p className="flex items-center gap-1.5">
                  <Phone className="size-3" aria-hidden="true" />
                  {b.phone}
                </p>
              )}
              {b.email && (
                <p className="flex items-center gap-1.5">
                  <Mail className="size-3" aria-hidden="true" />
                  {b.email}
                </p>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: 'users',
        header: 'Users',
        hideOnMobile: true,
        cell: (b) => <span className="tabular-nums">{b.users_count ?? '—'}</span>,
      },
      { id: 'status', header: 'Status', cell: (b) => <StatusBadge active={b.is_active} /> },
      {
        id: 'created_at',
        header: 'Created',
        sortField: 'created_at',
        hideOnMobile: true,
        cell: (b) => <span className="text-muted-foreground">{formatDate(b.created_at)}</span>,
      },
      {
        id: 'actions',
        header: <span className="sr-only">Actions</span>,
        headerClassName: 'w-12',
        className: 'text-right',
        cell: (b) =>
          canUpdate ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Edit ${b.name}`}
                  onClick={() => setDialog({ open: true, branch: b })}
                >
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
        title="Branches"
        icon={Building2}
        description="Stores, warehouses and offices that sell and hold stock."
        actions={
          <Can permission={PERMISSIONS.BRANCHES_CREATE}>
            <Button onClick={() => setDialog({ open: true, branch: null })}>
              <Plus data-icon="inline-start" />
              New branch
            </Button>
          </Can>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput
          value={list.search}
          onChange={list.setSearch}
          placeholder="Search code, name, phone, email…"
          aria-label="Search branches"
        />
        <StatusFilter value={list.filters.is_active} onChange={(v) => list.setFilter('is_active', v)} />
        {list.hasActiveFilters && (
          <Button variant="ghost" onClick={list.reset}>
            <FunnelX data-icon="inline-start" />
            Clear
          </Button>
        )}
      </div>

      <DataTable
        caption="Branches"
        columns={columns}
        data={query.data?.items}
        getRowId={(b) => b.id}
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
            ? { title: 'No matching branches', description: 'Try a different search or clear the filters.', icon: FunnelX }
            : {
                title: 'No branches yet',
                description: 'Create your first branch to start selling.',
                icon: Building2,
              }
        }
      />

      <BranchFormDialog
        open={dialog.open}
        branch={dialog.branch}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
      />
    </div>
  )
}

export default BranchesPage
