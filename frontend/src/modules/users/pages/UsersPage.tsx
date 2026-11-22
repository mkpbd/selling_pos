import { useMemo, useState } from 'react'
import { Crown, FunnelX, Pencil, UserPlus, Users } from 'lucide-react'
import { Can, useAuth, usePermission } from '@/modules/authentication'
import { DataTable, type DataTableColumn } from '@/shared/components/data-table'
import { PageHeader } from '@/shared/components/PageHeader'
import { SearchInput } from '@/shared/components/SearchInput'
import { StatusFilter } from '@/shared/components/StatusFilter'
import { parseBooleanFilter } from '@/shared/utils/filters'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { PERMISSIONS } from '@/shared/constants/permissions'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { useListParams } from '@/shared/hooks/useListParams'
import { formatDate, formatDateTime, formatRelative, initials } from '@/shared/utils/format'
import { UserFormSheet } from '../components/UserFormSheet'
import { useUserList } from '../hooks/useUsers'
import type { User, UserListParams } from '../types'

const ALL_BRANCHES = '__all__'

export function UsersPage() {
  useDocumentTitle('Users')
  const { user: me } = useAuth()
  const list = useListParams<'is_active' | 'branch_id'>({ filterKeys: ['is_active', 'branch_id'] })
  const canUpdate = usePermission(PERMISSIONS.USERS_UPDATE)
  const [sheet, setSheet] = useState<{ open: boolean; user: User | null }>({ open: false, user: null })

  const params = useMemo<UserListParams>(
    () => ({
      page: list.page,
      per_page: list.perPage,
      search: list.search || undefined,
      sort: list.sort,
      is_active: parseBooleanFilter(list.filters.is_active),
      branch_id: list.filters.branch_id,
    }),
    [list.page, list.perPage, list.search, list.sort, list.filters.is_active, list.filters.branch_id],
  )
  const query = useUserList(params)

  const columns = useMemo<DataTableColumn<User>[]>(
    () => [
      {
        id: 'name',
        header: 'User',
        sortField: 'name',
        cell: (u) => (
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initials(u.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate font-medium">
                {u.name}
                {u.is_super_admin && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Crown className="size-3.5 text-warning" aria-label="Super admin" />
                    </TooltipTrigger>
                    <TooltipContent>Super admin</TooltipContent>
                  </Tooltip>
                )}
              </p>
              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
            </div>
          </div>
        ),
      },
      {
        id: 'branches',
        header: 'Branches & roles',
        hideOnMobile: true,
        cell: (u) =>
          u.branches.length === 0 ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <div className="flex max-w-sm flex-wrap gap-1">
              {u.branches.slice(0, 3).map((b) => (
                <Badge key={b.id} variant="outline" className="gap-1 font-normal">
                  <span className="font-mono font-semibold">{b.code}</span>
                  {b.roles.length > 0 && <span className="text-muted-foreground">{b.roles.join(', ')}</span>}
                </Badge>
              ))}
              {u.branches.length > 3 && <Badge variant="secondary">+{u.branches.length - 3}</Badge>}
            </div>
          ),
      },
      { id: 'status', header: 'Status', cell: (u) => <StatusBadge active={u.is_active} /> },
      {
        id: 'last_login_at',
        header: 'Last login',
        sortField: 'last_login_at',
        hideOnMobile: true,
        cell: (u) => (
          <span className="text-muted-foreground" title={formatDateTime(u.last_login_at, 'Never')}>
            {formatRelative(u.last_login_at)}
          </span>
        ),
      },
      {
        id: 'created_at',
        header: 'Created',
        sortField: 'created_at',
        hideOnMobile: true,
        cell: (u) => <span className="text-muted-foreground">{formatDate(u.created_at)}</span>,
      },
      {
        id: 'actions',
        header: <span className="sr-only">Actions</span>,
        headerClassName: 'w-12',
        className: 'text-right',
        cell: (u) =>
          canUpdate ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`Edit ${u.name}`} onClick={() => setSheet({ open: true, user: u })}>
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
        title="Users"
        icon={Users}
        description="Team members, their branches and what they can do at each."
        actions={
          <Can permission={PERMISSIONS.USERS_CREATE}>
            <Button onClick={() => setSheet({ open: true, user: null })}>
              <UserPlus data-icon="inline-start" />
              New user
            </Button>
          </Can>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput value={list.search} onChange={list.setSearch} placeholder="Search name or email…" aria-label="Search users" />
        <StatusFilter value={list.filters.is_active} onChange={(v) => list.setFilter('is_active', v)} />
        <Select
          value={list.filters.branch_id ?? ALL_BRANCHES}
          onValueChange={(v) => list.setFilter('branch_id', v === ALL_BRANCHES ? undefined : v)}
        >
          <SelectTrigger className="w-full sm:w-48" aria-label="Filter by branch">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_BRANCHES}>All branches</SelectItem>
            {me?.branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.code} · {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {list.hasActiveFilters && (
          <Button variant="ghost" onClick={list.reset}>
            <FunnelX data-icon="inline-start" />
            Clear
          </Button>
        )}
      </div>

      <DataTable
        caption="Users"
        columns={columns}
        data={query.data?.items}
        getRowId={(u) => u.id}
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
            ? { title: 'No matching users', description: 'Try a different search or clear the filters.', icon: FunnelX }
            : { title: 'No users yet', description: 'Add your first team member.', icon: Users }
        }
      />

      <UserFormSheet open={sheet.open} user={sheet.user} onOpenChange={(open) => setSheet((s) => ({ ...s, open }))} />
    </div>
  )
}

export default UsersPage
