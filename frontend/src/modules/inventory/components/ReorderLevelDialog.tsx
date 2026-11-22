import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { LoaderCircle } from 'lucide-react'
import { FormAlert } from '@/shared/components/FormAlert'
import { FormTextField } from '@/shared/components/form/FormTextField'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { formatQuantity } from '@/shared/utils/decimal'
import { applyServerErrors } from '@/shared/utils/form-errors'
import { useSetReorderLevel } from '../hooks/useInventory'
import {
  createReorderLevelSchema,
  type ReorderLevelFormOutput,
  type ReorderLevelFormValues,
} from '../schemas/adjustment.schema'
import type { StockItem } from '../types'

interface ReorderLevelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: StockItem | null
}

export function ReorderLevelDialog({ open, onOpenChange, item }: ReorderLevelDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {open && item && <ReorderForm key={item.product_id} item={item} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function ReorderForm({ item, onDone }: { item: StockItem; onDone: () => void }) {
  const save = useSetReorderLevel()
  const [formErrors, setFormErrors] = useState<string[]>([])
  const allowsDecimal = item.unit.allows_decimal
  const schema = useMemo(() => createReorderLevelSchema(allowsDecimal), [allowsDecimal])
  const form = useForm<ReorderLevelFormValues, unknown, ReorderLevelFormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { reorder_level: formatQuantity(item.reorder_level).replace(/,/g, '') },
  })

  const onSubmit = form.handleSubmit(async ({ reorder_level }) => {
    setFormErrors([])
    try {
      await save.mutateAsync({ productId: item.product_id, reorderLevel: reorder_level })
      toast.success(`Reorder level for ${item.name} set to ${formatQuantity(reorder_level)} ${item.unit.code}.`)
      onDone()
    } catch (error) {
      setFormErrors(applyServerErrors(error, form.setError, { fields: ['reorder_level'] }).unmatched)
    }
  })

  return (
    <>
      <DialogHeader>
        <DialogTitle>Set reorder level</DialogTitle>
        <DialogDescription>
          {item.name} shows as <span className="font-medium text-foreground">low stock</span> at or below this quantity. Use 0 to
          disable.
        </DialogDescription>
      </DialogHeader>
      <form id="reorder-form" onSubmit={onSubmit} noValidate className="space-y-4">
        <FormAlert messages={formErrors} />
        <FormTextField
          control={form.control}
          name="reorder_level"
          label="Reorder level"
          type="number"
          inputMode={allowsDecimal ? 'decimal' : 'numeric'}
          step={allowsDecimal ? '0.001' : '1'}
          min="0"
          autoFocus
          endAddon={item.unit.code}
        />
      </form>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit" form="reorder-form" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <LoaderCircle className="animate-spin" data-icon="inline-start" />}
          Save
        </Button>
      </DialogFooter>
    </>
  )
}
