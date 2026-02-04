import { describe, it, expect } from 'vitest'
import { formatElapsedTime, formatDateShort, formatDateLong } from '../formatting'

describe('formatElapsedTime', () => {
  it('returns days only for short spans', () => {
    const from = new Date(2025, 0, 1)
    const to = new Date(2025, 0, 4)
    expect(formatElapsedTime(from, to)).toBe('3d')
  })

  it('returns weeks and days', () => {
    const from = new Date(2025, 0, 1)
    const to = new Date(2025, 0, 12)
    expect(formatElapsedTime(from, to)).toBe('1s 4d')
  })

  it('returns months accurately across February', () => {
    const from = new Date(2025, 0, 15) // Jan 15
    const to = new Date(2025, 2, 15) // Mar 15
    expect(formatElapsedTime(from, to)).toBe('2m')
  })

  it('handles months + weeks', () => {
    const from = new Date(2025, 0, 1) // Jan 1
    const to = new Date(2025, 1, 10) // Feb 10
    // 1 month (Jan 1 -> Feb 1) + 1 week (Feb 1 -> Feb 8) + 2 days
    expect(formatElapsedTime(from, to)).toBe('1m 1s')
  })

  it('handles months + days (no full weeks)', () => {
    const from = new Date(2025, 0, 1)
    const to = new Date(2025, 1, 5)
    // 1 month (Jan 1 -> Feb 1) + 4 days
    expect(formatElapsedTime(from, to)).toBe('1m 4d')
  })

  it('handles exactly one month', () => {
    const from = new Date(2025, 0, 1)
    const to = new Date(2025, 1, 1)
    expect(formatElapsedTime(from, to)).toBe('1m')
  })

  it('handles 0 days', () => {
    const from = new Date(2025, 0, 1)
    const to = new Date(2025, 0, 1)
    expect(formatElapsedTime(from, to)).toBe('0d')
  })
})

describe('formatDateShort', () => {
  it('formats date in Spanish short format', () => {
    const result = formatDateShort('2025-01-15')
    expect(result).toBe('15 ene')
  })
})

describe('formatDateLong', () => {
  it('formats date in Spanish long format', () => {
    const result = formatDateLong('2025-06-15')
    expect(result).toBe('15 de junio, 2025')
  })
})
