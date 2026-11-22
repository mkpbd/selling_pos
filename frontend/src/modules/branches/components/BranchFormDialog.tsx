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
import { useCreateBranch, useUpdateBranch } from '../hooks/useBranches'
import {
  BRANCH_FORM_FIELDS,
  branchSchema,
  branchToFormValues,
  type BranchFormOutput,
  type BranchFormValues,
} from '../schemas/branch.schema'
import type { Branch } from '../types'

interface BranchFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Branch to edit; omit to create. */
  branch?: Branch | null
}

export function BranchFormDialog({ open, onOpenChange, branch }: BranchFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {/* Keyed so the form remounts with fresh defaults for each branch. */}
        {open && <BranchForm key={branch?.id ?? 'new'} branch={branch} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function BranchForm({ branch, onDone }: { branch?: Branch | null; onDone: () => void }) {
  const isEdit = Boolean(branch)
  const create = useCreateBranch()
  const update = useUpdateBranch()
  const [formErrors, setFormErrors] = useState<string[]>([])

  const form = useForm<BranchFormValues, unknown, BranchFormOutput>({
    resolver: zodResolver(branchSchema),
    defaultValues: branchToFormValues(branch),
  })

  const onSubmit = form.handleSubmit(async (input) => {
    setFormErrors([])
    try {
      const saved = branch ? await update.mutateAsync({ id: branch.id, input }) : await create.mutateAsync(input)
      toast.success(isEdit ? `Branch ${saved.code} updated.` : `Branch ${saved.code} created.`)
      onDone()
    } catch (error) {
      const { unmatched } = applyServerErrors(error, form.setError, {
        fields: BRANCH_FORM_FIELDS,
        codeFields: { [ERROR_CODES.BRANCH_CODE_TAKEN]: 'code' },
      })
      setFormErrors(unmatched)
    }
  })

  const pending = form.formState.isSubmitting

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? `Edit ${branch?.name}` : 'New branch'}</DialogTitle>
        <DialogDescription>
          {isEdit ? 'Update branch details. Deactivate a branch instead of deleting it.' : 'Add a store, warehouse or office location.'}
        </DialogDescription>
      </DialogHeader>
      <form id="branch-form" onSubmit={onSubmit} noValidate className="space-y-4">
        <FormAlert messages={formErrors} />
        <FieldGroup className="gap-4">
          <div className="grid gap-4 sm:grid-cols-[9rem_1fr]">
            <FormTextField
              control={form.control}
              name="code"
              label="Code"
              placeholder="HQ"
              required
              maxLength={20}
              autoFocus={!isEdit}
              transform={(v) => v.toUpperCase()}
              inputClassName="font-mono uppercase"
            />
            <FormTextField control={form.control} name="name" label="Name" placeholder="Head Office" required maxLength={150} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormTextField control={form.control} name="phone" label="Phone" type="tel" autoComplete="tel" maxLength={30} />
            <FormTextField control={form.control} name="email" label="Email" type="email" autoComplete="email" />
          </div>
          <FormTextField control={form.control} name="address" label="Address" type="textarea" maxLength={500} />
          <FormSwitchField
            control={form.control}
            name="is_active"
            label="Active"
            description="Inactive branches can't be selected for sales or assigned to users."
          />
        </FieldGroup>
      </form>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" disabled={pending}>
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" form="branch-form" disabled={pending} aria-busy={pending}>
          {pending && <LoaderCircle className="animate-spin" data-icon="inline-start" />}
          {isEdit ? 'Save changes' : 'Create branch'}
        </Button>
      </DialogFooter>
    </>
  )
}
