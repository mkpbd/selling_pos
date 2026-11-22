import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { http } from '@/shared/services/http'
import { renderWithProviders } from '@/test/utils'
import type { StockItem } from '../types'
import { AdjustStockDialog } from './AdjustStockDialog'

const item: StockItem = {
  product_id: 'p-1',
  sku: 'COKE-500',
  name: 'Coca-Cola 500ml',
  barcode: null,
  unit: { code: 'PCS', allows_decimal: false },
  quantity: '5.000',
  reorder_level: '2.000',
  status: 'in_stock',
  stock_value: '175.00',
  last_movement_at: null,
}

type Reply = { status: number; data?: unknown } | 'network'

const success = {
  success: true,
  data: {
    movement: { id: 'm-1' },
    stock: { ...item, quantity: '8.000' },
  },
  meta: { request_id: 'r' },
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

/** Fake axios adapter: replies from a queue and records each request. */
function installAdapter(replies: Reply[]) {
  const calls: InternalAxiosRequestConfig[] = []
  const adapter: AxiosAdapter = async (config) => {
    calls.push(config)
    const reply = replies.shift() ?? { status: 201, data: success }
    if (reply === 'network') throw new AxiosError('Network Error', 'ERR_NETWORK', config)
    const response = { status: reply.status, statusText: '', data: reply.data, headers: new AxiosHeaders(), config }
    if (reply.status >= 400) throw new AxiosError('fail', 'ERR_BAD_REQUEST', config, {}, response)
    return response
  }
  http.defaults.adapter = adapter
  return calls
}

const keyOf = (c: InternalAxiosRequestConfig | undefined) => c?.headers.get('Idempotency-Key')
const bodyOf = (c: InternalAxiosRequestConfig | undefined) => JSON.parse(String(c?.data)) as Record<string, unknown>

describe('<AdjustStockDialog> idempotency', () => {
  const originalAdapter = http.defaults.adapter
  beforeEach(() => {
    http.defaults.adapter = originalAdapter
  })
  afterEach(() => {
    http.defaults.adapter = originalAdapter
  })

  it('sends an Idempotency-Key and reuses it when the same submission is retried', async () => {
    // Attempt 1 fails twice at the network level (one automatic retry), the manual retry succeeds.
    const calls = installAdapter(['network', 'network', { status: 201, data: success }])
    const user = userEvent.setup()
    renderWithProviders(<AdjustStockDialog open item={item} onOpenChange={() => {}} />)

    await user.type(screen.getByLabelText(/^Quantity/), '3')
    await user.click(screen.getByRole('button', { name: 'Save adjustment' }))

    expect(await screen.findByText(/submit again to retry safely/i, {}, { timeout: 3000 })).toBeInTheDocument()
    expect(calls).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'Save adjustment' }))
    await waitFor(() => expect(calls).toHaveLength(3))

    const key = keyOf(calls[0])
    expect(key).toMatch(UUID_RE)
    expect(calls.map(keyOf)).toEqual([key, key, key])
    expect(calls[0]?.url).toBe('/inventory/adjustments')
    expect(bodyOf(calls[0])).toEqual({ product_id: 'p-1', type: 'in', quantity: '3.000', reason: 'received', note: null })
  })

  it('uses a new key when the payload changes, and shows the available quantity on INSUFFICIENT_STOCK', async () => {
    const calls = installAdapter([
      {
        status: 422,
        data: {
          success: false,
          error: { code: 'INSUFFICIENT_STOCK', message: 'Insufficient stock.', details: { available: '5.000' } },
          meta: { request_id: 'r' },
        },
      },
      { status: 201, data: success },
    ])
    const user = userEvent.setup()
    renderWithProviders(<AdjustStockDialog open item={item} defaultType="out" onOpenChange={() => {}} />)

    const quantity = screen.getByLabelText(/^Quantity/)
    await user.type(quantity, '9')
    await user.click(screen.getByRole('button', { name: 'Save adjustment' }))

    expect(await screen.findByText('Not enough stock. Only 5 PCS available.')).toBeInTheDocument()

    await user.clear(quantity)
    await user.type(quantity, '4')
    await user.click(screen.getByRole('button', { name: 'Save adjustment' }))
    await waitFor(() => expect(calls).toHaveLength(2))

    expect(keyOf(calls[0])).toMatch(UUID_RE)
    expect(keyOf(calls[1])).toMatch(UUID_RE)
    expect(keyOf(calls[1])).not.toBe(keyOf(calls[0]))
    expect(bodyOf(calls[1])).toMatchObject({ type: 'out', quantity: '4.000', reason: 'damaged' })
  })

  it('previews the resulting quantity before saving', async () => {
    installAdapter([])
    const user = userEvent.setup()
    renderWithProviders(<AdjustStockDialog open item={item} onOpenChange={() => {}} />)

    await user.type(screen.getByLabelText(/^Quantity/), '3')
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('(+3)')).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: /stock count/i }))
    expect(screen.getByLabelText(/^Counted quantity/)).toBeInTheDocument()
    expect(screen.getByText('(−2)')).toBeInTheDocument()
  })
})
