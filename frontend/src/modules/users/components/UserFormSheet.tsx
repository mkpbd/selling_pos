import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { LoaderCircle } from 'lucide-react'
import { useAuth } from '@/modules/authentication'
import { useRoles } from '@/modules/roles'
import { ErrorState } from '@/shared/components/ErrorState'
import { FormAlert } from '@/shared/components/FormAlert'
import { FormSwitchField } from '@/shared/components/form/FormSwitchField'
import { FormTextField } from '@/shared/components/form/FormTextField'
import { Button } from '@/shared/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from '@/shared/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Separator } from '@/shared/components/ui/separator'
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
import type { BranchRef } from '@/shared/types'
import { applyServerErrors } from '@/shared/utils/form-errors'
import { useCreateUser, useUpdateUser } from '../hooks/useUsers'
import {
  createUserSchema,
  toCreatePayload,
  toUpdatePayload,
  USER_FORM_FIELDS,
  userToFormValues,
  type UserFormValues,
} from '../schemas/user.schema'
import type { BranchRoleInput, User } from '../types'
import { BranchRolesEditor } from './BranchRolesEditor'

interface UserFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User | null
}

const NO_DEFAULT = '__none__'

export function UserFormSheet({ open, onOpenChange, user }: UserFormSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-xl">
        {open && <UserForm key={user?.id ?? 'new'} user={user} onDone={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  )
}

function UserForm({ user, onDone }: { user?: User | null; onDone: () => void }) {
  const mode = user ? 'edit' : 'create'
  const { user: me } = useAuth()
  const roles = useRoles()
  const create = useCreateUser()
  const update = useUpdateUser()
  const [formErrors, setFormErrors] = useState<string[]>([])
  const schema = useMemo(() => createUserSchema(mode), [mode])

  const form = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: userToFormValues(user),
  })
  const branchRoles = useWatch({ control: form.control, name: 'branch_roles' })

  // Assignable branches = the editor's own branches; keep the user's other branches visible but locked.
  const { branches, lockedBranchIds } = useMemo(() => {
    const own = me?.branches ?? []
    const ownIds = new Set(own.map((b) => b.id))
    const foreign: BranchRef[] = (user?.branches ?? [])
      .filter((b) => !ownIds.has(b.id))
      .map(({ id, code, name }) => ({ id, code, name }))
    return { branches: [...own, ...foreign], lockedBranchIds: foreign.map((b) => b.id) }
  }, [me?.branches, user?.branches])

  const selectedBranches = branches.filter((b) => branchRoles.some((br) => br.branch_id === b.id))

  const handleBranchRolesChange = (next: BranchRoleInput[]) => {
    form.setValue('branch_roles', next, { shouldDirty: true, shouldValidate: form.formState.isSubmitted })
    const current = form.getValues('default_branch_id')
    if (current && !next.some((br) => br.branch_id === current)) {
      form.setValue('default_branch_id', null, { shouldDirty: true })
    } else if (!current && next.length === 1) {
      form.setValue('default_branch_id', next[0]?.branch_id ?? null, { shouldDirty: true })
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setFormErrors([])
    try {
      const saved = user
        ? await update.mutateAsync({ id: user.id, input: toUpdatePayload(values) })
        : await create.mutateAsync(toCreatePayload(values))
      toast.success(user ? `${saved.name} updated.` : `${saved.name} added.`)
      onDone()
    } catch (error) {
      // 403 FORBIDDEN (role escalation guard) has no details: shown as a form-level error.
      setFormErrors(
        applyServerErrors(error, form.setError, {
          fields: USER_FORM_FIELDS,
          codeFields: { [ERROR_CODES.EMAIL_TAKEN]: 'email' },
        }).unmatched,
      )
    }
  })

  const pending = form.formState.isSubmitting

  return (
    <>
      <SheetHeader className="border-b">
        <SheetTitle>{user ? `Edit ${user.name}` : 'New user'}</SheetTitle>
        <SheetDescription>
          {user ? 'Update profile, access and branch roles.' : 'Invite a team member and choose what they can do at each branch.'}
        </SheetDescription>
      </SheetHeader>

      <form id="user-form" onSubmit={onSubmit} noValidate className="flex-1 space-y-6 overflow-y-auto p-4">
        <FormAlert messages={formErrors} />

        <FieldSet>
          <FieldLegend variant="label">Profile</FieldLegend>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormTextField control={form.control} name="name" label="Full name" required autoComplete="off" maxLength={150} autoFocus={!user} />
            <FormTextField control={form.control} name="email" label="Email" type="email" required autoComplete="off" />
          </div>
          <FormSwitchField
            control={form.control}
            name="is_active"
            label="Active"
            description="Inactive users can't sign in. Deactivating also revokes their API tokens."
          />
        </FieldSet>

        <Separator />

        <FieldSet>
          <FieldLegend variant="label">Branches &amp; roles</FieldLegend>
          <FieldDescription>Roles apply per branch. Pick the branches this user works at, then their roles there.</FieldDescription>
          {roles.isPending ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : roles.error ? (
            <ErrorState error={roles.error} onRetry={() => void roles.refetch()} title="Couldn't load roles" />
          ) : (
            <BranchRolesEditor
              branches={branches}
              lockedBranchIds={lockedBranchIds}
              roles={roles.data}
              value={branchRoles}
              onChange={handleBranchRolesChange}
              errors={form.formState.errors.branch_roles}
            />
          )}

          <Controller
            control={form.control}
            name="default_branch_id"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="default-branch">Default branch</FieldLabel>
                <Select
                  value={field.value ?? NO_DEFAULT}
                  onValueChange={(v) => field.onChange(v === NO_DEFAULT ? null : v)}
                  disabled={selectedBranches.length === 0}
                >
                  <SelectTrigger id="default-branch" className="w-full" aria-invalid={fieldState.invalid || undefined}>
                    <SelectValue placeholder="Select a default branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_DEFAULT}>No default</SelectItem>
                    {selectedBranches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.code} · {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>Used when the user signs in without choosing a branch.</FieldDescription>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </FieldSet>

        <Separator />

        <FieldSet>
          <FieldLegend variant="label">{user ? 'Reset password' : 'Password'}</FieldLegend>
          {user && <FieldDescription>Leave blank to keep the current password.</FieldDescription>}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormTextField
              control={form.control}
              name="password"
              label="Password"
              type="password-toggle"
              autoComplete="new-password"
              required={!user}
            />
            <FormTextField
              control={form.control}
              name="password_confirmation"
              label="Confirm password"
              type="password-toggle"
              autoComplete="new-password"
              required={!user}
            />
          </div>
          <FieldDescription>At least 8 characters with mixed case, a number and a symbol.</FieldDescription>
        </FieldSet>
      </form>

      <SheetFooter className="flex-row justify-end border-t">
        <SheetClose asChild>
          <Button variant="outline" disabled={pending}>
            Cancel
          </Button>
        </SheetClose>
        <Button type="submit" form="user-form" disabled={pending} aria-busy={pending}>
          {pending && <LoaderCircle className="animate-spin" data-icon="inline-start" />}
          {user ? 'Save changes' : 'Create user'}
        </Button>
      </SheetFooter>
    </>
  )
}
