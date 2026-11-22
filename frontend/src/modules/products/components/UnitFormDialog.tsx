import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { LoaderCircle } from 'lucide-react'
import { FormAlert } from '@/shared/components/FormAlert'
import { FormSwitchField } from '@/shared/components/form/FormSwitchField'
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
import { FieldGroup } from '@/shared/components/ui/field'
import { ERROR_CODES } from '@/shared/constants/error-codes'
import { applyServerErrors } from '@/shared/utils/form-errors'
import { useSaveUnit } from '../hooks/useCatalog'
import { unitSchema, unitToFormValues, type UnitFormOutput, type UnitFormValues } from '../schemas/catalog.schema'
import type { Unit } from '../types'

interface UnitFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  unit?: Unit | null
}

export function UnitFormDialog({ open, onOpenChange, unit }: UnitFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && <UnitForm key={unit?.id ?? 'new'} unit={unit} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function UnitForm({ unit, onDone }: { unit?: Unit | null; onDone: () => void }) {
  const save = useSaveUnit()
  const [formErrors, setFormErrors] = useState<string[]>([])
  const form = useForm<UnitFormValues, unknown, UnitFormOutput>({
    resolver: zodResolver(unitSchema),
    defaultValues: unitToFormValues(unit),
  })

  const onSubmit = form.handleSubmit(async (input) => {
    setFormErrors([])
    try {
      const saved = await save.mutateAsync({ id: unit?.id, input })
      toast.success(unit ? `Unit ${saved.code} updated.` : `Unit ${saved.code} created.`)
      onDone()
    } catch (error) {
      setFormErrors(
        applyServerErrors(error, form.setError, {
          fields: ['code', 'name', 'allows_decimal'],
          codeFields: { [ERROR_CODES.UNIT_CODE_TAKEN]: 'code' },
        }).unmatched,
      )
    }
  })

  const pending = form.formState.isSubmitting
  return (
    <>
      <DialogHeader>
        <DialogTitle>{unit ? 'Edit unit' : 'New unit'}</DialogTitle>
        <DialogDescription>How a product is counted and sold.</DialogDescription>
      </DialogHeader>
      <form id="unit-form" onSubmit={onSubmit} noValidate className="space-y-4">
        <FormAlert messages={formErrors} />
        <FieldGroup className="gap-4">
          <div className="grid gap-4 sm:grid-cols-[7rem_1fr]">
            <FormTextField
              control={form.control}
              name="code"
              label="Code"
              required
              maxLength={10}
              autoFocus
              placeholder="PCS"
              transform={(v) => v.toUpperCase()}
              inputClassName="font-mono uppercase"
            />
            <FormTextField control={form.control} name="name" label="Name" required maxLength={50} placeholder="Piece" />
          </div>
          <FormSwitchField
            control={form.control}
            name="allows_decimal"
            label="Allow decimal quantities"
            description="For weight or volume (KG, L). Off means whole numbers only."
          />
        </FieldGroup>
      </form>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" disabled={pending}>
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" form="unit-form" disabled={pending}>
          {pending && <LoaderCircle className="animate-spin" data-icon="inline-start" />}
          {unit ? 'Save changes' : 'Create unit'}
        </Button>
      </DialogFooter>
    </>
  )
}
