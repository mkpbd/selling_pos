import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/shared/components/ui/input-group'
import { cn } from '@/shared/utils/cn'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  delay?: number
  className?: string
  'aria-label'?: string
}

/** Text input that reports (trimmed) changes after the user stops typing. */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  delay = 350,
  className,
  'aria-label': ariaLabel = 'Search',
}: SearchInputProps) {
  const [draft, setDraft] = useState(value)
  const [prevValue, setPrevValue] = useState(value)
  const timer = useRef<number | undefined>(undefined)

  // Sync external changes (e.g. "clear filters", back/forward navigation).
  if (value !== prevValue) {
    setPrevValue(value)
    if (value.trim() !== draft.trim()) setDraft(value)
  }

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const schedule = (next: string) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      if (next.trim() !== value.trim()) onChange(next.trim())
    }, delay)
  }

  return (
    <InputGroup className={cn('w-full sm:w-72', className)}>
      <InputGroupAddon>
        <Search aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value)
          schedule(event.target.value)
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
      {draft && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label="Clear search"
            onClick={() => {
              window.clearTimeout(timer.current)
              setDraft('')
              if (value) onChange('')
            }}
          >
            <X />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}
