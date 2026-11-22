import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
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
import { FieldGroup } from '@/shared/components/ui/field'
import { applyServerErrors } from '@/shared/utils/form-errors'
import { useChangePassword } from '../hooks/useAuthMutations'
import { changePasswordSchema, type ChangePasswordFormValues } from '../schemas/auth.schemas'
import { PasswordChecklist } from './PasswordChecklist'

interface ChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const EMPTY: ChangePasswordFormValues = { current_password: '', password: '', password_confirmation: '' }

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const change = useChangePassword()
  const [formErrors, setFormErrors] = useState<string[]>([])
  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY,
  })
  const password = useWatch({ control: form.control, name: 'password' })

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      form.reset(EMPTY)
      setFormErrors([])
    }
    onOpenChange(next)
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setFormErrors([])
    try {
      await change.mutateAsync(values)
      toast.success('Password updated.')
      handleOpenChange(false)
    } catch (error) {
      setFormErrors(
        applyServerErrors(error, form.setError, {
          fields: ['current_password', 'password', 'password_confirmation'],
        }).unmatched,
      )
    }
  })

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>Use at least 8 characters with mixed case, a number and a symbol.</DialogDescription>
        </DialogHeader>
        <form id="change-password-form" onSubmit={onSubmit} noValidate className="space-y-4">
          <FormAlert messages={formErrors} />
          <FieldGroup className="gap-4">
            <FormTextField
              control={form.control}
              name="current_password"
              label="Current password"
              type="password-toggle"
              autoComplete="current-password"
              autoFocus
            />
            <FormTextField
              control={form.control}
              name="password"
              label="New password"
              type="password-toggle"
              autoComplete="new-password"
            />
            <PasswordChecklist value={password} />
            <FormTextField
              control={form.control}
              name="password_confirmation"
              label="Confirm new password"
              type="password-toggle"
              autoComplete="new-password"
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" form="change-password-form" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <LoaderCircle className="animate-spin" data-icon="inline-start" />}
            Update password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
