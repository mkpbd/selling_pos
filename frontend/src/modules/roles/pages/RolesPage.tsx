import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Lock, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { Can, usePermission } from '@/modules/authentication'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { DataTable, type DataTableColumn } from '@/shared/components/data-table'
import { PageHeader } from '@/shared/components/PageHeader'
import { SearchInput } from '@/shared/components/SearchInput'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { ERROR_CODES } from '@/shared/constants/error-codes'
import { PERMISSIONS } from '@/shared/constants/permissions'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { normalizeError } from '@/shared/services/http'
import { formatDate, pluralize } from '@/shared/utils/format'
import { RoleFormSheet } from '../components/RoleFormSheet'
import { useDeleteRole, usePermissionGroups, useRoles } from '../hooks/useRoles'
import type { Role } from '../types'

const DELETE_ERRORS: Record<string, string> = {
  [ERROR_CODES.SYSTEM_ROLE_IMMUTABLE]: 'System roles cannot be deleted.',
  [ERROR_CODES.ROLE_IN_USE]: 'This role is still assigned to users. Remove it from them first.',
}

export function RolesPage() {
  useDocumentTitle('Roles & permissions')
  const roles = useRoles()
  const canManage = usePermission(PERMISSIONS.ROLES_MANAGE)
  const permissionGroups = usePermissionGroups()
  const deleteRole = useDeleteRole()
  const [search, setSearch] = useState('')
  const [sheet, setSheet] = useState<{ open: boolean; role: Role | null }>({ open: false, role: null })
  const [toDelete, setToDelete] = useState<Role | null>(null)

  const totalPermissions = useMemo(
    () => permissionGroups.data?.reduce((sum, g) => sum + g.permissions.length, 0),
    [permissionGroups.data],
  )

  // GET /roles isn't paginated, so search runs client-side.
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return term ? roles.data?.filter((r) => r.name.toLowerCase().includes(term)) : roles.data
  }, [roles.data, search])

  const confirmDelete = async () => {
    if (!toDelete) return
    try {
      await deleteRole.mutateAsync(toDelete)
      toast.success(`Role “${toDelete.name}” deleted.`)
      setToDelete(null)
    } catch (error) {
      const apiError = normalizeError(error)
      toast.error(DELETE_ERRORS[apiError.code] ?? apiError.message)
      setToDelete(null)
    }
  }

  const columns: DataTableColumn<Role>[] = [
    {
      id: 'name',
      header: 'Role',
      cell: (r) => (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono font-medium">{r.name}</span>
          {r.is_system && (
            <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
              <Lock className="size-3" aria-hidden="true" />
              System
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: 'permissions',
      header: 'Permissions',
      cell: (r) => (
        <Badge variant="secondary" className="tabular-nums">
          {totalPermissions ? `${r.permissions.length} of ${totalPermissions}` : pluralize(r.permissions.length, 'permission')}
        </Badge>
      ),
    },
    {
      id: 'users',
      header: 'Users',
      cell: (r) => <span className="tabular-nums">{r.users_count.toLocaleString()}</span>,
    },
    {
      id: 'updated',
      header: 'Updated',
      hideOnMobile: true,
      cell: (r) => <span className="text-muted-foreground">{formatDate(r.updated_at)}</span>,
    },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      headerClassName: 'w-24',
      className: 'text-right',
      cell: (r) =>
        canManage ? (
          <div className="flex justify-end gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`Edit ${r.name}`} onClick={() => setSheet({ open: true, role: r })}>
                  <Pencil />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                {/* span keeps the tooltip working when the button is disabled */}
                <span tabIndex={r.is_system ? 0 : -1} className="inline-flex">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Delete ${r.name}`}
                    disabled={r.is_system}
                    onClick={() => setToDelete(r)}
                  >
                    <Trash2 />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>{r.is_system ? 'System roles cannot be deleted' : 'Delete'}</TooltipContent>
            </Tooltip>
          </div>
        ) : null,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & permissions"
        icon={ShieldCheck}
        description="Define what each role can do. Roles are assigned to users per branch."
        actions={
          <Can permission={PERMISSIONS.ROLES_MANAGE}>
            <Button onClick={() => setSheet({ open: true, role: null })}>
              <Plus data-icon="inline-start" />
              New role
            </Button>
          </Can>
        }
      />

      <SearchInput value={search} onChange={setSearch} delay={150} placeholder="Search roles…" aria-label="Search roles" />

      <DataTable
        caption="Roles"
        columns={columns}
        data={filtered}
        getRowId={(r) => r.id}
        isLoading={roles.isPending}
        isFetching={roles.isFetching}
        error={roles.error}
        onRetry={() => void roles.refetch()}
        skeletonRows={4}
        empty={
          search
            ? { title: 'No matching roles', description: 'Try a different search term.' }
            : { title: 'No roles yet', description: 'Create a role to start granting permissions.', icon: ShieldCheck }
        }
      />

      <RoleFormSheet open={sheet.open} role={sheet.role} onOpenChange={(open) => setSheet((s) => ({ ...s, open }))} />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && setToDelete(null)}
        destructive
        title={`Delete role “${toDelete?.name ?? ''}”?`}
        description={
          toDelete && toDelete.users_count > 0
            ? `This role is assigned to ${pluralize(toDelete.users_count, 'user')}. The server will refuse to delete a role that's still in use.`
            : 'This permanently removes the role. This action cannot be undone.'
        }
        confirmLabel="Delete role"
        loading={deleteRole.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}

export default RolesPage
