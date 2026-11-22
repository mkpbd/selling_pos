import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'

interface StatusFilterProps {
  /** 'true' | 'false' | undefined (all) */
  value: string | undefined
  onChange: (value: string | undefined) => void
}

/** All / Active / Inactive filter for `is_active`. */
export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <Select value={value ?? 'all'} onValueChange={(v) => onChange(v === 'all' ? undefined : v)}>
      <SelectTrigger className="w-full sm:w-36" aria-label="Filter by status">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All statuses</SelectItem>
        <SelectItem value="true">Active</SelectItem>
        <SelectItem value="false">Inactive</SelectItem>
      </SelectContent>
    </Select>
  )
}
