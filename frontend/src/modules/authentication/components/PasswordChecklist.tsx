import { Check, X } from 'lucide-react'
import { PASSWORD_RULES } from '@/shared/validation/password'
import { cn } from '@/shared/utils/cn'

/** Live checklist of the backend password rules. */
export function PasswordChecklist({ value }: { value: string }) {
  return (
    <ul className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-2" aria-label="Password requirements">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(value)
        return (
          <li
            key={rule.id}
            className={cn('flex items-center gap-1.5 transition-colors', ok ? 'text-success' : 'text-muted-foreground')}
          >
            {ok ? <Check className="size-3.5" aria-hidden="true" /> : <X className="size-3.5" aria-hidden="true" />}
            <span>{rule.label}</span>
            <span className="sr-only">{ok ? '(met)' : '(not met)'}</span>
          </li>
        )
      })}
    </ul>
  )
}
