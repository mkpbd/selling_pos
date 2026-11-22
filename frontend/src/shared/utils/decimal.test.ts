import { describe, expect, it } from 'vitest'
import {
  addDecimal,
  addPercent,
  compareDecimal,
  countDecimals,
  formatMoney,
  formatPercent,
  formatQuantity,
  formatSignedQuantity,
  fromUnits,
  isDecimalString,
  marginPercent,
  normalizeDecimal,
  subtractDecimal,
  toUnits,
} from './decimal'

describe('toUnits / fromUnits', () => {
  it('parses decimal strings into scaled integers', () => {
    expect(toUnits('1250.50', 2)).toBe(125050n)
    expect(toUnits('1,250.5', 2)).toBe(125050n)
    expect(toUnits('.5', 3)).toBe(500n)
    expect(toUnits('-2.000', 3)).toBe(-2000n)
    expect(toUnits(3.25, 2)).toBe(325n)
  })

  it('rounds extra digits half-up and rejects garbage', () => {
    expect(toUnits('0.125', 2)).toBe(13n)
    expect(toUnits('0.124', 2)).toBe(12n)
    expect(toUnits('abc', 2)).toBeNull()
    expect(toUnits('', 2)).toBeNull()
    expect(toUnits('1.2.3', 2)).toBeNull()
    expect(toUnits(null, 2)).toBeNull()
  })

  it('formats back to fixed strings', () => {
    expect(fromUnits(125050n, 2)).toBe('1250.50')
    expect(fromUnits(-50n, 3)).toBe('-0.050')
    expect(fromUnits(0n, 2)).toBe('0.00')
  })

  it('normalizes to the API scale', () => {
    expect(normalizeDecimal('12', 3)).toBe('12.000')
    expect(normalizeDecimal('45.5', 2)).toBe('45.50')
    expect(normalizeDecimal('x', 2)).toBeNull()
  })
})

describe('arithmetic without float drift', () => {
  it('adds and subtracts exactly', () => {
    expect(addDecimal('0.1', '0.2', 2)).toBe('0.30')
    expect(addDecimal('24.000', '0.250')).toBe('24.250')
    expect(subtractDecimal('24.000', '30')).toBe('-6.000')
    expect(compareDecimal('1.000', '1')).toBe(0)
    expect(compareDecimal('0.999', '1')).toBe(-1)
  })

  it('computes margin percent like the API (null when selling is 0)', () => {
    expect(marginPercent('35.00', '45.00')).toBe('22.22')
    expect(marginPercent('50', '45')).toBe('-11.11')
    expect(marginPercent('10', '0')).toBeNull()
    expect(marginPercent('', '10')).toBeNull()
  })

  it('applies a tax percentage with rounding', () => {
    expect(addPercent('45.00', '5.00')).toBe('47.25')
    expect(addPercent('9.99', '7.5')).toBe('10.74')
  })
})

describe('validation helpers', () => {
  it('checks decimal input strictly', () => {
    expect(isDecimalString('12.50', 2)).toBe(true)
    expect(isDecimalString('12.505', 2)).toBe(false)
    expect(isDecimalString('-1', 2)).toBe(false)
    expect(isDecimalString('-1', 2, true)).toBe(true)
    expect(isDecimalString('1e3', 3)).toBe(false)
    expect(countDecimals('1.250')).toBe(3)
    expect(countDecimals('7')).toBe(0)
  })
})

describe('display formatting', () => {
  it('formats money with grouping and 2 decimals', () => {
    expect(formatMoney('152340.5')).toBe('152,340.50')
    expect(formatMoney('0')).toBe('0.00')
    expect(formatMoney('-5')).toBe('−5.00')
    expect(formatMoney(null)).toBe('—')
    expect(formatMoney('99999999999999999.99')).toBe('99,999,999,999,999,999.99')
  })

  it('formats quantities without trailing zeros', () => {
    expect(formatQuantity('12.000')).toBe('12')
    expect(formatQuantity('0.250')).toBe('0.25')
    expect(formatQuantity('1234.500')).toBe('1,234.5')
    expect(formatSignedQuantity('2.000')).toBe('+2')
    expect(formatSignedQuantity('-0.500')).toBe('−0.5')
    expect(formatSignedQuantity('0')).toBe('0')
  })

  it('formats percentages', () => {
    expect(formatPercent('5.00')).toBe('5%')
    expect(formatPercent('22.20')).toBe('22.2%')
    expect(formatPercent(null)).toBe('—')
  })
})
