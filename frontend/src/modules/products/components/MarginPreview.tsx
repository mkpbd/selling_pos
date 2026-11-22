import { TrendingDown, TrendingUp } from 'lucide-react'
import {
  addPercent,
  formatMoney,
  formatPercent,
  isDecimalString,
  marginPercent,
  subtractDecimal,
  MONEY_SCALE,
} from '@/shared/utils/decimal'
import { cn } from '@/shared/utils/cn'

interface MarginPreviewProps {
  cost: string
  selling: string
  tax: string
}

const valid = (v: string, dp: number) => v.trim() !== '' && isDecimalString(v, dp)

/** Live margin / profit / price-incl-tax preview, computed with exact decimal math. */
export function MarginPreview({ cost, selling, tax }: MarginPreviewProps) {
  const ready = valid(cost, MONEY_SCALE) && valid(selling, MONEY_SCALE)
  const margin = ready ? marginPercent(cost, selling) : null
  const profit = ready ? subtractDecimal(selling, cost, MONEY_SCALE) : null
  const gross = valid(selling, MONEY_SCALE) ? addPercent(selling, valid(tax, 2) ? tax : '0') : null
  const negative = profit !== null && profit.startsWith('-')

  return (
    <div
      className={cn(
        'grid grid-cols-3 gap-px overflow-hidden rounded-xl border text-center',
        negative ? 'border-destructive/40 bg-destructive/20' : 'bg-border',
      )}
      aria-live="polite"
      aria-label="Pricing preview"
    >
      <div className="bg-card px-3 py-3">
        <p className="text-xs text-muted-foreground">Margin</p>
        <p className={cn('mt-1 flex items-center justify-center gap-1 font-semibold tabular-nums', negative ? 'text-destructive' : 'text-success')}>
          {margin !== null && (negative ? <TrendingDown className="size-3.5" aria-hidden="true" /> : <TrendingUp className="size-3.5" aria-hidden="true" />)}
          {formatPercent(margin)}
        </p>
      </div>
      <div className="bg-card px-3 py-3">
        <p className="text-xs text-muted-foreground">Profit / unit</p>
        <p className={cn('mt-1 font-semibold tabular-nums', negative && 'text-destructive')}>{formatMoney(profit)}</p>
      </div>
      <div className="bg-card px-3 py-3">
        <p className="text-xs text-muted-foreground">Price incl. tax</p>
        <p className="mt-1 font-semibold tabular-nums">{formatMoney(gross)}</p>
      </div>
      {negative && (
        <p className="col-span-3 bg-destructive/5 px-3 py-1.5 text-xs text-destructive">
          Selling price is below cost. You'll lose money on every sale.
        </p>
      )}
    </div>
  )
}
