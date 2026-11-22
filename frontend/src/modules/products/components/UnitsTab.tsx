import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Plus, Ruler, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { DataTable, type DataTableColumn } from '@/shared/components/data-table'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { ERROR_CODES } from '@/shared/constants/error-codes'
import { normalizeError } from '@/shared/services/http'
import { pluralize } from '@/shared/utils/format'
import { useDeleteUnit, useUnits } from '../hooks/useCatalog'
import type { Unit } from '../types'
import { UnitFormDialog } from './UnitFormDialog'

export function UnitsTab() {
  const units = useUnits()
  const remove = useDeleteUnit()
  const [dialog, setDialog] = useState<{ open: boolean; unit: Unit | null }>({ open: false, unit: null })
  const [toDelete, setToDelete] = useState<Unit | null>(null)

  const confirmDelete = async () => {
    if (!toDelete) return
    try {
      await remove.mutateAsync(toDelete)
      toast.success(`Unit ${toDelete.code} deleted.`)
    } catch (error) {
      const e = normalizeError(error)
      toast.error(e.code === ERROR_CODES.UNIT_IN_USE ? `${toDelete.code} is used by products and can't be deleted.` : e.message)
    } finally {
      setToDelete(null)
    }
  }

  const columns: DataTableColumn<Unit>[] = [
    {
      id: 'code',
      header: 'Code',
      cell: (u) => (
        <Badge variant="secondary" className="font-mono">
          {u.code}
        </Badge>
      ),
    },
    { id: 'name', header: 'Name', cell: (u) => <span className="font-medium">{u.name}</span> },
    {
      id: 'decimal',
      header: 'Quantities',
      cell: (u) =>
        u.allows_decimal ? (
          <Badge variant="outline" className="border-primary/30 text-primary">
            Decimal (0.001)
          </Badge>
        ) : (
          <Badge variant="outline">Whole numbers</Badge>
        ),
    },
    { id: 'products', header: 'Products', className: 'tabular-nums', cell: (u) => u.products_count.toLocaleString() },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      headerClassName: 'w-24',
      className: 'text-right',
      cell: (u) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${u.code}`} onClick={() => setDialog({ open: true, unit: u })}>
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Delete ${u.code}`}
            onClick={() => setToDelete(u)}
          >
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialog({ open: true, unit: null })}>
          <Plus data-icon="inline-start" />
          New unit
        </Button>
      </div>
      <DataTable
        caption="Units of measure"
        columns={columns}
        data={units.data}
        getRowId={(u) => u.id}
        isLoading={units.isPending}
        isFetching={units.isFetching}
        error={units.error}
        onRetry={() => void units.refetch()}
        skeletonRows={4}
        empty={{ title: 'No units yet', description: 'Add units such as PCS, BOX or KG.', icon: Ruler }}
      />
      <UnitFormDialog open={dialog.open} unit={dialog.unit} onOpenChange={(open) => setDialog((d) => ({ ...d, open }))} />
      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && setToDelete(null)}
        destructive
        title={`Delete unit ${toDelete?.code ?? ''}?`}
        description={
          toDelete && toDelete.products_count > 0
            ? `It's used by ${pluralize(toDelete.products_count, 'product')}, so the server will refuse.`
            : 'This permanently removes the unit.'
        }
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
