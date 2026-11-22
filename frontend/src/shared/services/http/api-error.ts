import { isAxiosError, isCancel } from 'axios'
import { ERROR_CODES, type ErrorCode } from '@/shared/constants/error-codes'
import type { ApiErrorEnvelope, FieldErrors } from './types'

const STATUS_FALLBACK: Record<number, { code: ErrorCode; message: string }> = {
  400: { code: ERROR_CODES.BAD_REQUEST, message: 'The request could not be processed.' },
  401: { code: ERROR_CODES.UNAUTHENTICATED, message: 'Your session has expired. Please sign in again.' },
  403: { code: ERROR_CODES.FORBIDDEN, message: 'You do not have permission to perform this action.' },
  404: { code: ERROR_CODES.NOT_FOUND, message: 'The requested resource was not found.' },
  419: { code: ERROR_CODES.CSRF_TOKEN_MISMATCH, message: 'Your session token expired. Please try again.' },
  422: { code: ERROR_CODES.VALIDATION_FAILED, message: 'The given data was invalid.' },
  429: { code: ERROR_CODES.TOO_MANY_REQUESTS, message: 'Too many attempts. Please wait a moment and try again.' },
  500: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Something went wrong on our side. Please try again.' },
}

export interface ApiErrorShape {
  status: number
  code: ErrorCode
  message: string
  details: FieldErrors
  requestId: string | null
}

/** Typed, normalised error thrown by every HTTP call in the app. */
export class ApiError extends Error implements ApiErrorShape {
  readonly status: number
  readonly code: ErrorCode
  readonly details: FieldErrors
  readonly requestId: string | null

  constructor({ status, code, message, details, requestId }: ApiErrorShape) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    this.requestId = requestId
  }

  get isValidation(): boolean {
    return this.status === 422 && this.code === ERROR_CODES.VALIDATION_FAILED
  }

  /** First message for a field, if any. */
  fieldError(field: string): string | undefined {
    return this.details[field]?.[0]
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isErrorEnvelope(value: unknown): value is ApiErrorEnvelope {
  if (!isRecord(value) || value.success !== false || !isRecord(value.error)) return false
  return typeof value.error.code === 'string' && typeof value.error.message === 'string'
}

function sanitizeDetails(details: unknown): FieldErrors {
  if (!isRecord(details)) return {}
  const out: FieldErrors = {}
  for (const [key, val] of Object.entries(details)) {
    if (Array.isArray(val)) out[key] = val.filter((m): m is string => typeof m === 'string')
    else if (typeof val === 'string') out[key] = [val]
  }
  return out
}

function headerValue(headers: unknown, name: string): string | null {
  if (!isRecord(headers)) return null
  const getter = (headers as { get?: unknown }).get
  if (typeof getter === 'function') {
    const v: unknown = getter.call(headers, name)
    if (typeof v === 'string') return v
  }
  const raw = headers[name] ?? headers[name.toLowerCase()]
  return typeof raw === 'string' ? raw : null
}

/** Converts anything thrown by axios (or otherwise) into an {@link ApiError}. */
export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (isCancel(error)) {
    return new ApiError({
      status: 0,
      code: ERROR_CODES.REQUEST_CANCELLED,
      message: 'The request was cancelled.',
      details: {},
      requestId: null,
    })
  }

  if (isAxiosError(error)) {
    const response = error.response
    if (!response) {
      const timedOut = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
      return new ApiError({
        status: 0,
        code: ERROR_CODES.NETWORK_ERROR,
        message: timedOut
          ? 'The server took too long to respond. Please try again.'
          : 'Unable to reach the server. Check your connection and try again.',
        details: {},
        requestId: null,
      })
    }

    const { status, data, headers } = response
    const headerRequestId = headerValue(headers, 'x-request-id')

    if (isErrorEnvelope(data)) {
      return new ApiError({
        status,
        code: data.error.code,
        message: data.error.message,
        details: sanitizeDetails(data.error.details),
        requestId: data.meta?.request_id ?? headerRequestId,
      })
    }

    const fallback =
      STATUS_FALLBACK[status] ??
      (status >= 500
        ? STATUS_FALLBACK[500]
        : { code: ERROR_CODES.UNKNOWN_ERROR, message: 'An unexpected error occurred.' })
    return new ApiError({ status, ...fallback, details: {}, requestId: headerRequestId })
  }

  return new ApiError({
    status: 0,
    code: ERROR_CODES.UNKNOWN_ERROR,
    message: error instanceof Error && error.message ? error.message : 'An unexpected error occurred.',
    details: {},
    requestId: null,
  })
}
