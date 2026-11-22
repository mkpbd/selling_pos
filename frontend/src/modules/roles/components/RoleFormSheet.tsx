import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { LoaderCircle, Lock } from 'lucide-react'
import { ErrorState } from '@/shared/components/ErrorState'
import { FormAlert } from '@/shared/components/FormAlert'
import { FormTextField } from '@/shared/components/form/FormTextField'
import { Button } from '@/shared/components/ui/button'
import { FieldError, FieldLegend, FieldSet } from '@/shared/components/ui/field'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { ERROR_CODES } from '@/shared/constants/error-codes'
import { applyServerErrors } from '@/shared/utils/form-errors'
import { useCreateRole, usePermissionGroups, useUpdateRole } from '../hooks/useRoles'
import { roleSchema, roleToFormValues, type RoleFormOutput, type RoleFormValues } from '../schemas/role.schema'
import type { Role } from '../types'
import { PermissionMatrix } from './PermissionMatrix'

interface RoleFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role?: Role | null
}

export function RoleFormSheet({ open, onOpenChange, role }: RoleFormSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-xl">
        {open && <RoleForm key={role?.id ?? 'new'} role={role} onDone={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  )
}

function RoleForm({ role, onDone }: { role?: Role | null; onDone: () => void }) {
  const isEdit = Boolean(role)
  const isSystem = Boolean(role?.is_system)
  const groups = usePermissionGroups()
  const create = useCreateRole()
  const update = useUpdateRole()
  const [formErrors, setFormErrors] = useState<string[]>([])

  const form = useForm<RoleFormValues, unknown, RoleFormOutput>({
    resolver: zodResolver(roleSchema),
    defaultValues: roleToFormValues(role),
  })

  const onSubmit = form.handleSubmit(async (input) => {
    setFormErrors([])
    try {
      const saved = role ? await update.mutateAsync({ id: role.id, input }) : await create.mutateAsync(input)
      toast.success(isEdit ? `Role “${saved.name}” updated.` : `Role “${saved.name}” created.`)
      onDone()
    } catch (error) {
      setFormErrors(
        applyServerErrors(error, form.setError, {
          fields: ['name', 'permissions'],
          codeFields: {
            [ERROR_CODES.ROLE_NAME_TAKEN]: 'name',
            [ERROR_CODES.SYSTEM_ROLE_IMMUTABLE]: 'name',
          },
        }).unmatched,
      )
    }
  })

  const pending = form.formState.isSubmitting

  return (
    <>
      <SheetHeader className="border-b">
        <SheetTitle>{isEdit ? `Edit role` : 'New role'}</SheetTitle>
        <SheetDescription>
          Roles bundle permissions. Users get roles per branch, so access can differ between locations.
        </SheetDescription>
      </SheetHeader>
      <form id="role-form" onSubmit={onSubmit} noValidate className="flex-1 space-y-5 overflow-y-auto p-4">
        <FormAlert messages={formErrors} />
        <FormTextField
          control={form.control}
          name="name"
          label="Role name"
          placeholder="e.g. shift_supervisor"
          required
          disabled={isSystem}
          inputClassName="font-mono"
          transform={(v) => v.toLowerCase()}
          description={
            isSystem ? (
              <span className="inline-flex items-center gap-1">
                <Lock className="size-3" aria-hidden="true" />
                System roles can't be renamed. Their permissions can still be edited.
              </span>
            ) : (
              'Lowercase letters, numbers, dashes and underscores.'
            )
          }
        />
        <Controller
          control={form.control}
          name="permissions"
          render={({ field, fieldState }) => (
            <FieldSet>
              <FieldLegend variant="label">Permissions</FieldLegend>
              {groups.isPending ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }, (_, i) => (
                    <Skeleton key={i} className="h-28 w-full rounded-xl" />
                  ))}
                </div>
              ) : groups.error ? (
                <ErrorState error={groups.error} onRetry={() => void groups.refetch()} />
              ) : (
                <PermissionMatrix groups={groups.data} value={field.value} onChange={field.onChange} />
              )}
              <FieldError errors={[fieldState.error]} />
            </FieldSet>
          )}
        />
      </form>
      <SheetFooter className="flex-row justify-end border-t">
        <SheetClose asChild>
          <Button variant="outline" disabled={pending}>
            Cancel
          </Button>
        </SheetClose>
        <Button type="submit" form="role-form" disabled={pending || groups.isPending} aria-busy={pending}>
          {pending && <LoaderCircle className="animate-spin" data-icon="inline-start" />}
          {isEdit ? 'Save changes' : 'Create role'}
        </Button>
      </SheetFooter>
    </>
  )
}
