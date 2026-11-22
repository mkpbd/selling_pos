import { z } from 'zod'

/** Mirrors the backend rule: >= 8 chars, mixed case, a number and a symbol. */
export const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { id: 'lower', label: 'A lowercase letter', test: (v: string) => /[a-z]/.test(v) },
  { id: 'upper', label: 'An uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
  { id: 'number', label: 'A number', test: (v: string) => /\d/.test(v) },
  { id: 'symbol', label: 'A symbol', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
] as const

export const strongPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(255, 'Password is too long.')
  .regex(/[a-z]/, 'Password must contain a lowercase letter.')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter.')
  .regex(/\d/, 'Password must contain a number.')
  .regex(/[^A-Za-z0-9]/, 'Password must contain a symbol.')
