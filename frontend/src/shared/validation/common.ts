import { z } from 'zod'

export const emailField = z.string().trim().min(1, 'Email is required.').pipe(z.email('Enter a valid email address.'))

/** Optional text input: trims and converts '' to null (the API expects null for "no value"). */
export function optionalText(max: number, label = 'This field') {
  return z
    .string()
    .trim()
    .max(max, `${label} may not be greater than ${max} characters.`)
    .transform((value) => (value === '' ? null : value))
}

/** Optional email input: '' becomes null, otherwise must be a valid email. */
export const optionalEmail = z
  .string()
  .trim()
  .max(255, 'Email may not be greater than 255 characters.')
  .refine((value) => value === '' || z.email().safeParse(value).success, 'Enter a valid email address.')
  .transform((value) => (value === '' ? null : value))
