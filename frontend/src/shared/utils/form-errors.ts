import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import type { ErrorCode } from '@/shared/constants/error-codes'
import { isApiError } from '@/shared/services/http'

export interface ServerErrorMappingOptions {
  /**
   * Form field paths that can display errors. Use `*` for array indexes,
   * e.g. `branch_roles.*.roles`.
   */
  fields: readonly string[]
  /** Rename server keys to form paths, e.g. `{ password_confirmation: 'confirm' }`. */
  rename?: Record<string, string>
  /** Map an error code with no `details` to a field, e.g. `BRANCH_CODE_TAKEN -> code`. */
  codeFields?: Partial<Record<ErrorCode, string>>
}

export interface ServerErrorMappingResult {
  /** True when at least one message was attached to a field. */
  handled: boolean
  /** Messages that couldn't be attached to a field; show them in a form-level alert. */
  unmatched: string[]
}

function compile(pattern: string): RegExp {
  const escaped = pattern
    .split('.')
    .map((segment) => (segment === '*' ? '\\d+' : segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    .join('\\.')
  return new RegExp(`^${escaped}$`)
}

/**
 * Applies an API 422/409 error to react-hook-form fields.
 *
 * Nested keys such as `branch_roles.0.roles.1` resolve to the closest known
 * field (`branch_roles.0.roles`, then `branch_roles`).
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  { fields, rename = {}, codeFields = {} }: ServerErrorMappingOptions,
): ServerErrorMappingResult {
  if (!isApiError(error)) {
    return { handled: false, unmatched: [error instanceof Error ? error.message : 'Something went wrong.'] }
  }

  const matchers = fields.map(compile)
  const isKnown = (path: string) => matchers.some((re) => re.test(path))
  const assigned = new Set<string>()
  const unmatched: string[] = []
  let handled = false

  const assign = (path: string, message: string) => {
    if (assigned.has(path)) return
    assigned.add(path)
    setError(path as Path<T>, { type: 'server', message }, { shouldFocus: !handled })
    handled = true
  }

  for (const [rawKey, messages] of Object.entries(error.details)) {
    const message = messages[0]
    if (!message) continue
    const segments = (rename[rawKey] ?? rawKey).split('.')
    let target: string | null = null
    for (let i = segments.length; i > 0; i--) {
      const candidate = segments.slice(0, i).join('.')
      if (isKnown(candidate)) {
        target = candidate
        break
      }
    }
    if (target) assign(target, message)
    else unmatched.push(message)
  }

  const codeField = codeFields[error.code]
  if (codeField && !assigned.has(codeField)) {
    assign(codeField, error.fieldError(codeField) ?? error.message)
  }

  if (!handled && unmatched.length === 0) unmatched.push(error.message)

  return { handled, unmatched }
}
