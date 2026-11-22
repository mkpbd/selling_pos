import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { DataTable, type DataTableColumn } from '@/shared/components/data-table'
import { SearchInput } from '@/shared/components/SearchInput'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { Button } from '@/shared/components/ui/button'
import { ERROR_CODES } from '@/shared/constants/error-codes'
import { normalizeError } from '@/shared/services/http'
import { pluralize } from '@/shared/utils/format'
import { useCategories, useDeleteCategory } from '../hooks/useCatalog'
import type { Category } from '../types'
import { CategoryFormDialog } from './CategoryFormDialog'

export function CategoriesTab() {
  const categories = useCategories()
  const remove = useDeleteCategory()
  const [search, setSearch] = useState('')
  const [dialog, setDialog] = useState<{ open: boolean; category: Category | null }>({ open: false, category: null })
  const [toDelete, setToDelete] = useState<Category | null>(null)

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return term ? categories.data?.filter((c) => c.name.toLowerCase().includes(term)) : categories.data
  }, [categories.data, search])

  const confirmDelete = async () => {
    if (!toDelete) return
    try {
      await remove.mutateAsync(toDelete)
      toast.success(`Category “${toDelete.name}” deleted.`)
    } catch (error) {
      const e = normalizeError(error)
      toast.error(
        e.code === ERROR_CODES.CATEGORY_IN_USE
          ? `“${toDelete.name}” still has products. Move them or deactivate the category instead.`
          : e.message,
      )
    } finally {
      setToDelete(null)
    }
  }

  const columns: DataTableColumn<Category>[] = [
    {
      id: 'name',
      header: 'Name',
      cell: (c) => (
        <div className="min-w-0">
          <p className="font-medium">{c.name}</p>
          {c.description && <p className="max-w-md truncate text-xs text-muted-foreground">{c.description}</p>}
        </div>
      ),
    },
    { id: 'products', header: 'Products', className: 'tabular-nums', cell: (c) => c.products_count.toLocaleString() },
    { id: 'status', header: 'Status', cell: (c) => <StatusBadge active={c.is_active} /> },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      headerClassName: 'w-24',
      className: 'text-right',
      cell: (c) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${c.name}`} onClick={() => setDialog({ open: true, category: c })}>
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Delete ${c.name}`}
            onClick={() => setToDelete(c)}
          >
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} delay={150} placeholder="Search categories…" aria-label="Search categories" />
        <Button onClick={() => setDialog({ open: true, category: null })}>
          <Plus data-icon="inline-start" />
          New category
        </Button>
      </div>
      <DataTable
        caption="Categories"
        columns={columns}
        data={rows}
        getRowId={(c) => c.id}
        isLoading={categories.isPending}
        isFetching={categories.isFetching}
        error={categories.error}
        onRetry={() => void categories.refetch()}
        skeletonRows={4}
        empty={
          search
            ? { title: 'No matching categories' }
            : { title: 'No categories yet', description: 'Create categories to organise your catalogue.', icon: Tags }
        }
      />
      <CategoryFormDialog open={dialog.open} category={dialog.category} onOpenChange={(open) => setDialog((d) => ({ ...d, open }))} />
      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && setToDelete(null)}
        destructive
        title={`Delete category “${toDelete?.name ?? ''}”?`}
        description={
          toDelete && toDelete.products_count > 0
            ? `It's used by ${pluralize(toDelete.products_count, 'product')}, so the server will refuse. Deactivate it instead.`
            : 'This permanently removes the category.'
        }
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
