import { useState } from 'react'
import { toast } from 'sonner'
import { Building2, Check, ChevronsUpDown } from 'lucide-react'
import { useAuth } from '@/modules/authentication'
import { Button } from '@/shared/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { cn } from '@/shared/utils/cn'

/** Active-branch picker. Switching persists the choice and refetches every query. */
export function BranchSwitcher() {
  const { user, switchBranch } = useAuth()
  const [open, setOpen] = useState(false)
  if (!user) return null

  const current = user.current_branch
  const branches = user.branches

  if (branches.length <= 1) {
    return (
      <div className="hidden items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm sm:flex" aria-label="Current branch">
        <Building2 className="size-4 text-muted-foreground" aria-hidden="true" />
        <span className="max-w-40 truncate font-medium">{current?.name ?? 'No branch'}</span>
      </div>
    )
  }

  const select = async (id: string) => {
    setOpen(false)
    if (id === current?.id) return
    const target = branches.find((b) => b.id === id)
    await switchBranch(id)
    toast.success(`Switched to ${target?.name ?? 'branch'}`)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={`Active branch: ${current?.name ?? 'none'}. Change branch`}
          className="max-w-56 justify-between gap-2"
        >
          <Building2 className="text-primary" data-icon="inline-start" />
          <span className="hidden truncate sm:inline">{current?.name ?? 'Select branch'}</span>
          <span className="font-mono text-xs sm:hidden">{current?.code ?? '—'}</span>
          <ChevronsUpDown className="opacity-50" data-icon="inline-end" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="end">
        <Command>
          {branches.length > 6 && <CommandInput placeholder="Find a branch…" />}
          <CommandList>
            <CommandEmpty>No branch found.</CommandEmpty>
            <CommandGroup heading="Switch branch">
              {branches.map((b) => (
                <CommandItem key={b.id} value={`${b.code} ${b.name}`} onSelect={() => void select(b.id)}>
                  <span className="w-12 shrink-0 font-mono text-xs text-muted-foreground">{b.code}</span>
                  <span className="flex-1 truncate">{b.name}</span>
                  <Check className={cn('size-4', b.id === current?.id ? 'opacity-100' : 'opacity-0')} aria-hidden="true" />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
