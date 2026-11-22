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
import { useSaveCategory } from '../hooks/useCatalog'
import {
  categorySchema,
  categoryToFormValues,
  type CategoryFormOutput,
  type CategoryFormValues,
} from '../schemas/catalog.schema'
import type { Category } from '../types'

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
}

export function CategoryFormDialog({ open, onOpenChange, category }: CategoryFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && <CategoryForm key={category?.id ?? 'new'} category={category} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function CategoryForm({ category, onDone }: { category?: Category | null; onDone: () => void }) {
  const save = useSaveCategory()
  const [formErrors, setFormErrors] = useState<string[]>([])
  const form = useForm<CategoryFormValues, unknown, CategoryFormOutput>({
    resolver: zodResolver(categorySchema),
    defaultValues: categoryToFormValues(category),
  })

  const onSubmit = form.handleSubmit(async (input) => {
    setFormErrors([])
    try {
      const saved = await save.mutateAsync({ id: category?.id, input })
      toast.success(category ? `Category “${saved.name}” updated.` : `Category “${saved.name}” created.`)
      onDone()
    } catch (error) {
      setFormErrors(
        applyServerErrors(error, form.setError, {
          fields: ['name', 'description', 'is_active'],
          codeFields: { [ERROR_CODES.CATEGORY_NAME_TAKEN]: 'name' },
        }).unmatched,
      )
    }
  })

  const pending = form.formState.isSubmitting
  return (
    <>
      <DialogHeader>
        <DialogTitle>{category ? 'Edit category' : 'New category'}</DialogTitle>
        <DialogDescription>Group products for filtering and reporting.</DialogDescription>
      </DialogHeader>
      <form id="category-form" onSubmit={onSubmit} noValidate className="space-y-4">
        <FormAlert messages={formErrors} />
        <FieldGroup className="gap-4">
          <FormTextField control={form.control} name="name" label="Name" required maxLength={100} autoFocus placeholder="Beverages" />
          <FormTextField control={form.control} name="description" label="Description" type="textarea" maxLength={500} />
          <FormSwitchField
            control={form.control}
            name="is_active"
            label="Active"
            description="Inactive categories can't be assigned to products."
          />
        </FieldGroup>
      </form>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" disabled={pending}>
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" form="category-form" disabled={pending}>
          {pending && <LoaderCircle className="animate-spin" data-icon="inline-start" />}
          {category ? 'Save changes' : 'Create category'}
        </Button>
      </DialogFooter>
    </>
  )
}
