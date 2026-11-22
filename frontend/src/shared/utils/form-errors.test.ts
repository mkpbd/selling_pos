import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/shared/services/http'
import { applyServerErrors } from './form-errors'

const apiError = (status: number, code: string, details: Record<string, string[]>, message = 'Failed') =>
  new ApiError({ status, code, message, details, requestId: null })

describe('applyServerErrors', () => {
  it('maps flat and nested keys to the closest known field', () => {
    const setError = vi.fn()
    const result = applyServerErrors(
      apiError(422, 'VALIDATION_FAILED', {
        email: ['Email taken.'],
        'branch_roles.0.roles': ['Pick a role.'],
        'branch_roles.1.roles.0': ['Role is invalid.'],
        'branch_roles.2.branch_id': ['No access.'],
        unknown_field: ['Something else.'],
      }),
      setError,
      { fields: ['email', 'branch_roles', 'branch_roles.*.roles', 'branch_roles.*.branch_id'] },
    )

    expect(setError).toHaveBeenCalledWith('email', { type: 'server', message: 'Email taken.' }, expect.anything())
    expect(setError).toHaveBeenCalledWith('branch_roles.0.roles', expect.objectContaining({ message: 'Pick a role.' }), expect.anything())
    expect(setError).toHaveBeenCalledWith('branch_roles.1.roles', expect.objectContaining({ message: 'Role is invalid.' }), expect.anything())
    expect(setError).toHaveBeenCalledWith('branch_roles.2.branch_id', expect.objectContaining({ message: 'No access.' }), expect.anything())
    expect(result).toEqual({ handled: true, unmatched: ['Something else.'] })
  })

  it('maps a 409 code to its field when details are missing', () => {
    const setError = vi.fn()
    applyServerErrors(apiError(409, 'BRANCH_CODE_TAKEN', {}, 'The code has already been taken.'), setError, {
      fields: ['code'],
      codeFields: { BRANCH_CODE_TAKEN: 'code' },
    })
    expect(setError).toHaveBeenCalledWith('code', expect.objectContaining({ message: 'The code has already been taken.' }), expect.anything())
  })

  it('returns the error message for errors without details (e.g. 403 FORBIDDEN)', () => {
    const setError = vi.fn()
    const result = applyServerErrors(apiError(403, 'FORBIDDEN', {}, 'You cannot assign role [admin].'), setError, {
      fields: ['name'],
    })
    expect(setError).not.toHaveBeenCalled()
    expect(result).toEqual({ handled: false, unmatched: ['You cannot assign role [admin].'] })
  })
})
