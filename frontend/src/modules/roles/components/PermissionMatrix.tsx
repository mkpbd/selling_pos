import { motion } from 'motion/react'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Badge } from '@/shared/components/ui/badge'
import { humanize } from '@/shared/utils/format'
import { cn } from '@/shared/utils/cn'
import type { PermissionGroup } from '../types'

interface PermissionMatrixProps {
  groups: PermissionGroup[]
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
}

/** Checkbox per permission, grouped, with a tri-state "select all" per group. */
export function PermissionMatrix({ groups, value, onChange, disabled }: PermissionMatrixProps) {
  const selected = new Set(value)

  const toggle = (name: string, checked: boolean) => {
    const next = new Set(selected)
    if (checked) next.add(name)
    else next.delete(name)
    onChange([...next])
  }

  const toggleGroup = (group: PermissionGroup, checked: boolean) => {
    const next = new Set(selected)
    for (const p of group.permissions) {
      if (checked) next.add(p.name)
      else next.delete(p.name)
    }
    onChange([...next])
  }

  return (
    <div className="grid gap-3">
      {groups.map((group, index) => {
        const count = group.permissions.filter((p) => selected.has(p.name)).length
        const all = count === group.permissions.length && count > 0
        const groupId = `perm-group-${group.group}`
        return (
          <motion.fieldset
            key={group.group}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.2 }}
            className={cn('rounded-xl border bg-card transition-colors', count > 0 && 'border-primary/30 bg-primary/3')}
          >
            <legend className="sr-only">{humanize(group.group)} permissions</legend>
            <div className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
              <label htmlFor={groupId} className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold">
                <Checkbox
                  id={groupId}
                  checked={all ? true : count > 0 ? 'indeterminate' : false}
                  onCheckedChange={(c) => toggleGroup(group, c === true)}
                  disabled={disabled}
                  aria-label={`Select all ${humanize(group.group)} permissions`}
                />
                {humanize(group.group)}
              </label>
              <Badge variant={count > 0 ? 'default' : 'secondary'} className="tabular-nums">
                {count}/{group.permissions.length}
              </Badge>
            </div>
            <div className="grid gap-1 p-2 sm:grid-cols-2">
              {group.permissions.map((perm) => {
                const id = `perm-${perm.name}`
                return (
                  <label
                    key={perm.name}
                    htmlFor={id}
                    className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60"
                  >
                    <Checkbox
                      id={id}
                      checked={selected.has(perm.name)}
                      onCheckedChange={(c) => toggle(perm.name, c === true)}
                      disabled={disabled}
                      className="mt-0.5"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm">{perm.label || humanize(perm.name)}</span>
                      <span className="block font-mono text-[0.7rem] text-muted-foreground">{perm.name}</span>
                    </span>
                  </label>
                )
              })}
            </div>
          </motion.fieldset>
        )
      })}
    </div>
  )
}
