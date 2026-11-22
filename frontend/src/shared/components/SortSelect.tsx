import { ArrowUpDown } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'

export interface SortOption {
  /** API `sort` value, e.g. `name` or `-created_at`. */
  value: string
  label: string
}

interface SortSelectProps {
  value: string | undefined
  onChange: (value: string | undefined) => void
  options: SortOption[]
  /** Label for "server default order". */
  defaultLabel?: string
}

const DEFAULT = '__default__'

/** Sort picker: complements clickable headers and works on mobile where columns are hidden. */
export function SortSelect({ value, onChange, options, defaultLabel = 'Default order' }: SortSelectProps) {
  return (
    <Select value={value ?? DEFAULT} onValueChange={(v) => onChange(v === DEFAULT ? undefined : v)}>
      <SelectTrigger className="w-full sm:w-48" aria-label="Sort by">
        <ArrowUpDown className="text-muted-foreground" aria-hidden="true" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={DEFAULT}>{defaultLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
