import { AnimatePresence, motion } from 'motion/react'
import type { FieldError as RHFFieldError, Merge, FieldErrorsImpl } from 'react-hook-form'
import { Building2 } from 'lucide-react'
import type { Role } from '@/modules/roles'
import { Badge } from '@/shared/components/ui/badge'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { FieldError } from '@/shared/components/ui/field'
import type { BranchRef } from '@/shared/types'
import { cn } from '@/shared/utils/cn'
import type { BranchRoleInput } from '../types'

type BranchRoleErrors =
  | Merge<RHFFieldError, (Merge<RHFFieldError, FieldErrorsImpl<BranchRoleInput>> | undefined)[]>
  | undefined

interface BranchRolesEditorProps {
  /** Branches the editor may pick from (the current user's accessible branches). */
  branches: BranchRef[]
  /** Branches already assigned that the current user can't access (shown read-only). */
  lockedBranchIds?: string[]
  roles: Role[]
  value: BranchRoleInput[]
  onChange: (value: BranchRoleInput[]) => void
  errors?: BranchRoleErrors
  disabled?: boolean
}

/**
 * Pick branches, then roles per branch. Array order is kept stable so server
 * error keys like `branch_roles.0.roles` map back to the right branch.
 */
export function BranchRolesEditor({
  branches,
  lockedBranchIds = [],
  roles,
  value,
  onChange,
  errors,
  disabled,
}: BranchRolesEditorProps) {
  const indexOf = (branchId: string) => value.findIndex((br) => br.branch_id === branchId)

  const toggleBranch = (branchId: string, checked: boolean) => {
    if (checked) onChange([...value, { branch_id: branchId, roles: [] }])
    else onChange(value.filter((br) => br.branch_id !== branchId))
  }

  const toggleRole = (branchId: string, role: string, checked: boolean) => {
    onChange(
      value.map((br) =>
        br.branch_id !== branchId
          ? br
          : { ...br, roles: checked ? [...new Set([...br.roles, role])] : br.roles.filter((r) => r !== role) },
      ),
    )
  }

  const rootMessage = errors?.message ?? errors?.root?.message

  return (
    <div className="space-y-2">
      {branches.length === 0 && (
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          You don't have access to any branches to assign.
        </p>
      )}
      {branches.map((branch) => {
        const index = indexOf(branch.id)
        const selected = index !== -1
        const locked = lockedBranchIds.includes(branch.id)
        const itemErrors = selected ? errors?.[index] : undefined
        const checkboxId = `branch-${branch.id}`
        return (
          <div
            key={branch.id}
            className={cn(
              'rounded-xl border transition-colors',
              selected ? 'border-primary/40 bg-primary/4' : 'bg-card',
              itemErrors && 'border-destructive/50',
            )}
          >
            <label htmlFor={checkboxId} className="flex cursor-pointer items-center gap-3 px-3 py-2.5">
              <Checkbox
                id={checkboxId}
                checked={selected}
                disabled={disabled || locked}
                onCheckedChange={(c) => toggleBranch(branch.id, c === true)}
              />
              <Building2 className="size-4 text-muted-foreground" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{branch.name}</span>
              <Badge variant="secondary" className="font-mono">
                {branch.code}
              </Badge>
              {locked && <Badge variant="outline">No access</Badge>}
            </label>
            <AnimatePresence initial={false}>
              {selected && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden"
                >
                  <div className="border-t px-3 py-2.5">
                    <p className="mb-2 text-xs font-medium text-muted-foreground" id={`${checkboxId}-roles`}>
                      Roles at {branch.code}
                    </p>
                    <div className="flex flex-wrap gap-2" role="group" aria-labelledby={`${checkboxId}-roles`}>
                      {roles.map((role) => {
                        const roleId = `${checkboxId}-role-${role.id}`
                        const checked = value[index]?.roles.includes(role.name) ?? false
                        return (
                          <label
                            key={role.id}
                            htmlFor={roleId}
                            className={cn(
                              'flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring',
                              checked ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted',
                              (disabled || locked) && 'pointer-events-none opacity-60',
                            )}
                          >
                            <Checkbox
                              id={roleId}
                              checked={checked}
                              disabled={disabled || locked}
                              onCheckedChange={(c) => toggleRole(branch.id, role.name, c === true)}
                              className="sr-only"
                            />
                            {role.name}
                          </label>
                        )
                      })}
                    </div>
                    <FieldError className="mt-2 text-xs" errors={[itemErrors?.roles, itemErrors?.branch_id]} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
      {rootMessage && <FieldError errors={[{ message: rootMessage }]} />}
    </div>
  )
}
