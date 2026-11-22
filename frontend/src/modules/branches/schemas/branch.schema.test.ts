import { describe, expect, it } from 'vitest'
import { branchSchema, branchToFormValues } from './branch.schema'

const valid = {
  code: 'hq-01',
  name: '  Head Office ',
  phone: '',
  email: '',
  address: '',
  is_active: true,
}

function messagesFor(input: unknown, field: string): string[] {
  const result = branchSchema.safeParse(input)
  if (result.success) return []
  return result.error.issues.filter((i) => i.path[0] === field).map((i) => i.message)
}

describe('branchSchema', () => {
  it('uppercases the code, trims text and converts empty optionals to null', () => {
    expect(branchSchema.parse(valid)).toEqual({
      code: 'HQ-01',
      name: 'Head Office',
      phone: null,
      email: null,
      address: null,
      is_active: true,
    })
  })

  it.each([
    ['A', 'Code must be at least 2 characters.'],
    ['A'.repeat(21), 'Code may not be greater than 20 characters.'],
    ['HQ_01', 'Code may only contain letters A–Z, numbers and dashes.'],
    ['HQ 01', 'Code may only contain letters A–Z, numbers and dashes.'],
  ])('rejects code %j', (code, message) => {
    expect(messagesFor({ ...valid, code }, 'code')).toContain(message)
  })

  it('accepts 2 and 20 character codes made of A-Z, 0-9 and dashes', () => {
    expect(branchSchema.safeParse({ ...valid, code: 'W1' }).success).toBe(true)
    expect(branchSchema.safeParse({ ...valid, code: 'ABCDEFGHIJ-123456789' }).success).toBe(true)
  })

  it('requires a name of at most 150 characters', () => {
    expect(messagesFor({ ...valid, name: '   ' }, 'name')).toContain('Name is required.')
    expect(messagesFor({ ...valid, name: 'x'.repeat(151) }, 'name')).toHaveLength(1)
  })

  it('validates optional email, phone and address lengths', () => {
    expect(messagesFor({ ...valid, email: 'nope' }, 'email')).toContain('Enter a valid email address.')
    expect(branchSchema.parse({ ...valid, email: 'hq@shop.test' }).email).toBe('hq@shop.test')
    expect(messagesFor({ ...valid, phone: '1'.repeat(31) }, 'phone')).toHaveLength(1)
    expect(messagesFor({ ...valid, address: 'a'.repeat(501) }, 'address')).toHaveLength(1)
  })

  it('builds form defaults from an existing branch', () => {
    expect(
      branchToFormValues({
        id: '1',
        code: 'HQ',
        name: 'Head Office',
        phone: null,
        email: 'hq@shop.test',
        address: null,
        is_active: false,
        created_at: '',
        updated_at: '',
      }),
    ).toEqual({ code: 'HQ', name: 'Head Office', phone: '', email: 'hq@shop.test', address: '', is_active: false })
  })
})
