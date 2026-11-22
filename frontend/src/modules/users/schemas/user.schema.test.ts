import { describe, expect, it } from 'vitest'
import { createUserSchema, toUpdatePayload, type UserFormValues } from './user.schema'

const base: UserFormValues = {
  name: 'Sam Cashier',
  email: 'sam@shop.test',
  password: 'Str0ng!Pass',
  password_confirmation: 'Str0ng!Pass',
  is_active: true,
  default_branch_id: 'b-1',
  branch_roles: [{ branch_id: 'b-1', roles: ['cashier'] }],
}

const pathsOf = (mode: 'create' | 'edit', values: UserFormValues) => {
  const result = createUserSchema(mode).safeParse(values)
  return result.success ? [] : result.error.issues.map((i) => i.path.join('.'))
}

describe('user schema', () => {
  it('accepts a valid create payload', () => {
    expect(pathsOf('create', base)).toEqual([])
  })

  it('requires a strong, confirmed password on create', () => {
    expect(pathsOf('create', { ...base, password: '', password_confirmation: '' })).toContain('password')
    expect(pathsOf('create', { ...base, password: 'weakpass', password_confirmation: 'weakpass' })).toContain('password')
    expect(pathsOf('create', { ...base, password_confirmation: 'Other!123' })).toContain('password_confirmation')
  })

  it('allows a blank password on edit and omits it from the payload', () => {
    const values = { ...base, password: '', password_confirmation: '' }
    expect(pathsOf('edit', values)).toEqual([])
    expect(toUpdatePayload(values)).not.toHaveProperty('password')
  })

  it('requires the default branch to be one of the assigned branches', () => {
    expect(pathsOf('create', { ...base, default_branch_id: 'b-2' })).toContain('default_branch_id')
  })

  it('requires at least one role per assigned branch', () => {
    expect(pathsOf('create', { ...base, branch_roles: [{ branch_id: 'b-1', roles: [] }] })).toContain('branch_roles.0.roles')
  })
})
