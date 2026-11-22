/**
 * String/BigInt decimal helpers for money (2 dp) and quantities (3 dp).
 * Values travel as strings ("1250.50", "12.000"); arithmetic uses scaled
 * BigInts so display and previews never accumulate floating-point error.
 */

export const MONEY_SCALE = 2
export const QUANTITY_SCALE = 3
export const PERCENT_SCALE = 2

const DECIMAL_RE = /^([+-])?(\d*)(?:\.(\d*))?$/

const pow10 = (n: number): bigint => 10n ** BigInt(n)

/** Integer division rounding half away from zero. */
function divRound(numerator: bigint, denominator: bigint): bigint {
  const negative = numerator < 0n !== denominator < 0n
  const n = numerator < 0n ? -numerator : numerator
  const d = denominator < 0n ? -denominator : denominator
  const q = (n * 2n + d) / (d * 2n)
  return negative ? -q : q
}

/** Parses "1,250.5" / "12" / 3.5 into an integer scaled by 10^scale (half-up rounding of extra digits). */
export function toUnits(value: string | number | null | undefined, scale: number): bigint | null {
  if (value === null || value === undefined) return null
  let str: string
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null
    str = value.toFixed(Math.min(scale + 2, 20))
  } else {
    str = value.trim().replace(/[,\s]/g, '')
  }
  const match = DECIMAL_RE.exec(str)
  if (!match) return null
  const [, sign, intPart = '', fracPart = ''] = match
  if (!intPart && !fracPart) return null

  const kept = fracPart.slice(0, scale).padEnd(scale, '0')
  let units = BigInt(intPart || '0') * pow10(scale) + BigInt(kept || '0')
  const next = fracPart.charCodeAt(scale)
  if (!Number.isNaN(next) && next >= 53 /* '5' */) units += 1n
  return sign === '-' ? -units : units
}

/** Scaled integer back to a fixed-point string ("-12.050"). */
export function fromUnits(units: bigint, scale: number): string {
  const negative = units < 0n
  const abs = negative ? -units : units
  const int = (abs / pow10(scale)).toString()
  const frac = scale > 0 ? `.${(abs % pow10(scale)).toString().padStart(scale, '0')}` : ''
  return `${negative && abs !== 0n ? '-' : ''}${int}${frac}`
}

/** Normalises to a fixed-scale string, or null when not a number. */
export function normalizeDecimal(value: string | number | null | undefined, scale: number): string | null {
  const units = toUnits(value, scale)
  return units === null ? null : fromUnits(units, scale)
}

/** Number of digits after the decimal point in user input ("1.250" → 3). */
export function countDecimals(value: string): number {
  const frac = value.trim().split('.')[1]
  return frac ? frac.length : 0
}

/** Strict check for user input: optional sign, digits, at most `maxDecimals` decimals. */
export function isDecimalString(value: string, maxDecimals: number, allowNegative = false): boolean {
  const re = new RegExp(`^${allowNegative ? '-?' : ''}(\\d+(\\.\\d{0,${maxDecimals}})?|\\.\\d{1,${maxDecimals}})$`)
  return re.test(value.trim().replace(/,/g, ''))
}

export function compareDecimal(a: string, b: string, scale = QUANTITY_SCALE): -1 | 0 | 1 {
  const x = toUnits(a, scale) ?? 0n
  const y = toUnits(b, scale) ?? 0n
  return x === y ? 0 : x < y ? -1 : 1
}

export function addDecimal(a: string, b: string, scale = QUANTITY_SCALE): string {
  return fromUnits((toUnits(a, scale) ?? 0n) + (toUnits(b, scale) ?? 0n), scale)
}

export function subtractDecimal(a: string, b: string, scale = QUANTITY_SCALE): string {
  return fromUnits((toUnits(a, scale) ?? 0n) - (toUnits(b, scale) ?? 0n), scale)
}

export function isZeroDecimal(value: string, scale = QUANTITY_SCALE): boolean {
  return (toUnits(value, scale) ?? 0n) === 0n
}

/** (selling − cost) / selling × 100, 2 dp; null when selling is 0 or inputs are invalid (matches the API). */
export function marginPercent(cost: string, selling: string): string | null {
  const c = toUnits(cost, MONEY_SCALE)
  const s = toUnits(selling, MONEY_SCALE)
  if (c === null || s === null || s === 0n) return null
  return fromUnits(divRound((s - c) * 10_000n, s), PERCENT_SCALE)
}

/** amount × (1 + percent/100), rounded to 2 dp. */
export function addPercent(amount: string, percent: string): string | null {
  const a = toUnits(amount, MONEY_SCALE)
  const p = toUnits(percent, PERCENT_SCALE)
  if (a === null || p === null) return null
  return fromUnits(divRound(a * (10_000n + p), 10_000n), MONEY_SCALE)
}

function groupThousands(intPart: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function formatFixed(fixed: string, trimZeros: boolean): string {
  const negative = fixed.startsWith('-')
  const [int = '0', frac = ''] = (negative ? fixed.slice(1) : fixed).split('.')
  const fraction = trimZeros ? frac.replace(/0+$/, '') : frac
  return `${negative ? '−' : ''}${groupThousands(int)}${fraction ? `.${fraction}` : ''}`
}

/** Currency-neutral money display: "1250.5" → "1,250.50". */
export function formatMoney(value: string | number | null | undefined, fallback = '—'): string {
  const normalized = normalizeDecimal(value, MONEY_SCALE)
  return normalized === null ? fallback : formatFixed(normalized, false)
}

/** Quantity display without trailing zeros: "12.000" → "12", "0.250" → "0.25". */
export function formatQuantity(value: string | number | null | undefined, fallback = '—'): string {
  const normalized = normalizeDecimal(value, QUANTITY_SCALE)
  return normalized === null ? fallback : formatFixed(normalized, true)
}

/** Signed quantity for ledgers: "+2", "−0.5", "0". */
export function formatSignedQuantity(value: string | number | null | undefined, fallback = '—'): string {
  const units = toUnits(value ?? null, QUANTITY_SCALE)
  if (units === null) return fallback
  const text = formatQuantity(fromUnits(units, QUANTITY_SCALE))
  return units > 0n ? `+${text}` : text
}

/** "22.20" → "22.2%", "5.00" → "5%". */
export function formatPercent(value: string | number | null | undefined, fallback = '—'): string {
  const normalized = normalizeDecimal(value, PERCENT_SCALE)
  return normalized === null ? fallback : `${formatFixed(normalized, true)}%`
}
