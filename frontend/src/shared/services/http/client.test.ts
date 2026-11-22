import axios, { AxiosError, AxiosHeaders, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getActiveBranchId, setActiveBranchId } from '@/shared/services/branch-context'
import { ApiError } from './api-error'
import { setUnauthorizedHandler } from './auth-events'
import { http } from './client'

type Reply = { status: number; data: unknown }

/** Fake adapter: records requests and replies from a queue. */
function mockAdapter(replies: Reply[]) {
  const calls: InternalAxiosRequestConfig[] = []
  const adapter: AxiosAdapter = async (config) => {
    calls.push(config)
    const reply = replies.shift() ?? { status: 200, data: { success: true, data: null, meta: { request_id: 'x' } } }
    const response = { status: reply.status, statusText: '', data: reply.data, headers: new AxiosHeaders(), config }
    if (reply.status >= 400) throw new AxiosError('fail', 'ERR_BAD_REQUEST', config, {}, response)
    return response
  }
  return { adapter, calls }
}

const errorBody = (code: string) => ({ success: false, error: { code, message: code }, meta: { request_id: 'r' } })
const okBody = { success: true, data: { ok: true }, meta: { request_id: 'r' } }

describe('http client', () => {
  const originalAdapter = http.defaults.adapter

  beforeEach(() => setActiveBranchId(null))
  afterEach(() => {
    http.defaults.adapter = originalAdapter
    setUnauthorizedHandler(null)
    vi.restoreAllMocks()
  })

  it('sends Accept, credentials and the X-Branch-Id header', async () => {
    setActiveBranchId('branch-1')
    const { adapter, calls } = mockAdapter([{ status: 200, data: okBody }])
    http.defaults.adapter = adapter

    await http.get('/branches')

    expect(calls[0]?.headers.get('X-Branch-Id')).toBe('branch-1')
    expect(calls[0]?.headers.get('Accept')).toBe('application/json')
    expect(calls[0]?.withCredentials).toBe(true)
    expect(calls[0]?.baseURL).toBe('/api/v1')
  })

  it('on 419 refreshes the CSRF cookie once and retries', async () => {
    const csrf = vi.spyOn(axios, 'get').mockResolvedValue({ status: 204 })
    const { adapter, calls } = mockAdapter([
      { status: 419, data: errorBody('CSRF_TOKEN_MISMATCH') },
      { status: 200, data: okBody },
    ])
    http.defaults.adapter = adapter

    const res = await http.post('/branches', {})

    expect(res.status).toBe(200)
    expect(csrf).toHaveBeenCalledTimes(1)
    expect(csrf.mock.calls[0]?.[0]).toBe('/sanctum/csrf-cookie')
    expect(calls).toHaveLength(2)
  })

  it('does not retry a second 419', async () => {
    vi.spyOn(axios, 'get').mockResolvedValue({ status: 204 })
    const { adapter, calls } = mockAdapter([
      { status: 419, data: errorBody('CSRF_TOKEN_MISMATCH') },
      { status: 419, data: errorBody('CSRF_TOKEN_MISMATCH') },
    ])
    http.defaults.adapter = adapter

    await expect(http.post('/branches', {})).rejects.toMatchObject({ status: 419 })
    expect(calls).toHaveLength(2)
  })

  it('on 403 BRANCH_ACCESS_DENIED clears the stored branch and retries once without the header', async () => {
    setActiveBranchId('stale-branch')
    const { adapter, calls } = mockAdapter([
      { status: 403, data: errorBody('BRANCH_ACCESS_DENIED') },
      { status: 200, data: okBody },
    ])
    http.defaults.adapter = adapter

    await http.get('/auth/me')

    expect(calls).toHaveLength(2)
    expect(calls[1]?.headers.has('X-Branch-Id')).toBe(false)
    expect(getActiveBranchId()).toBeNull()
  })

  it('on 401 notifies the unauthorized handler and rejects with ApiError', async () => {
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    http.defaults.adapter = mockAdapter([{ status: 401, data: errorBody('UNAUTHENTICATED') }]).adapter

    const promise = http.get('/users')
    await expect(promise).rejects.toBeInstanceOf(ApiError)
    expect(handler).toHaveBeenCalledWith('expired')
  })

  it('treats 403 ACCOUNT_INACTIVE as a forced logout', async () => {
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    http.defaults.adapter = mockAdapter([{ status: 403, data: errorBody('ACCOUNT_INACTIVE') }]).adapter

    await expect(http.get('/users')).rejects.toMatchObject({ code: 'ACCOUNT_INACTIVE' })
    expect(handler).toHaveBeenCalledWith('inactive')
  })

  it('skips the unauthorized handler when skipAuthRedirect is set', async () => {
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    http.defaults.adapter = mockAdapter([{ status: 401, data: errorBody('UNAUTHENTICATED') }]).adapter

    await expect(http.get('/auth/me', { skipAuthRedirect: true })).rejects.toMatchObject({ status: 401 })
    expect(handler).not.toHaveBeenCalled()
  })
})
