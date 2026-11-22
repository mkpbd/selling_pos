import { AxiosError, AxiosHeaders, CanceledError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { describe, expect, it } from 'vitest'
import { ApiError, normalizeError } from './api-error'

function axiosErrorWith(status: number, data: unknown, headers: Record<string, string> = {}): AxiosError {
  const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig
  const response: AxiosResponse = {
    status,
    statusText: '',
    data,
    headers: new AxiosHeaders(headers),
    config,
  }
  return new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, {}, response)
}

describe('normalizeError', () => {
  it('maps the API error envelope, including details and request id', () => {
    const error = normalizeError(
      axiosErrorWith(422, {
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'The given data was invalid.',
          details: { email: ['The email field is required.'], 'branch_roles.0.roles': ['Pick a role.'] },
        },
        meta: { request_id: 'req-123' },
      }),
    )

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 422,
      code: 'VALIDATION_FAILED',
      message: 'The given data was invalid.',
      requestId: 'req-123',
    })
    expect(error.details).toEqual({
      email: ['The email field is required.'],
      'branch_roles.0.roles': ['Pick a role.'],
    })
    expect(error.isValidation).toBe(true)
    expect(error.fieldError('email')).toBe('The email field is required.')
  })

  it('keeps conflict codes such as BRANCH_CODE_TAKEN', () => {
    const error = normalizeError(
      axiosErrorWith(409, {
        success: false,
        error: { code: 'BRANCH_CODE_TAKEN', message: 'Code taken.', details: { code: ['Code taken.'] } },
        meta: { request_id: 'r' },
      }),
    )
    expect(error.status).toBe(409)
    expect(error.code).toBe('BRANCH_CODE_TAKEN')
    expect(error.fieldError('code')).toBe('Code taken.')
  })

  it('falls back to a status-based code and the X-Request-Id header for non-envelope bodies', () => {
    const error = normalizeError(axiosErrorWith(419, '<html>Page Expired</html>', { 'x-request-id': 'hdr-9' }))
    expect(error).toMatchObject({ status: 419, code: 'CSRF_TOKEN_MISMATCH', requestId: 'hdr-9', details: {} })
  })

  it('maps unknown 5xx to INTERNAL_ERROR', () => {
    expect(normalizeError(axiosErrorWith(503, null)).code).toBe('INTERNAL_ERROR')
  })

  it('reports network failures with status 0', () => {
    const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig
    const error = normalizeError(new AxiosError('Network Error', 'ERR_NETWORK', config))
    expect(error).toMatchObject({ status: 0, code: 'NETWORK_ERROR' })
  })

  it('reports cancellations', () => {
    expect(normalizeError(new CanceledError()).code).toBe('REQUEST_CANCELLED')
  })

  it('wraps arbitrary errors and passes ApiError through untouched', () => {
    expect(normalizeError(new Error('boom'))).toMatchObject({ status: 0, code: 'UNKNOWN_ERROR', message: 'boom' })
    const original = new ApiError({ status: 403, code: 'FORBIDDEN', message: 'No', details: {}, requestId: null })
    expect(normalizeError(original)).toBe(original)
  })
})
