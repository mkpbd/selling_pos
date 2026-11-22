/** URL filter string ('true' | 'false' | undefined) to an API boolean. */
export function parseBooleanFilter(value: string | undefined): boolean | undefined {
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}
