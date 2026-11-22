import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StockStatusBadge } from './StockStatusBadge'

describe('<StockStatusBadge>', () => {
  it.each([
    ['in_stock', 'In stock', 'text-success'],
    ['low_stock', 'Low stock', 'text-warning-foreground'],
    ['out_of_stock', 'Out of stock', 'text-destructive'],
  ] as const)('renders %s as a labelled, colour-coded badge', (status, label, tone) => {
    render(<StockStatusBadge status={status} />)
    const badge = screen.getByText(label)
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveAttribute('data-status', status)
    expect(badge.className).toContain(tone)
    // Icon present (not colour-only) and hidden from assistive tech.
    expect(badge.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})
