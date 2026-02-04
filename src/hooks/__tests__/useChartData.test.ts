import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useChartData } from '../useChartData'

describe('useChartData', () => {
  const entries = [
    { date: '2025-01-01', weight: 100 },
    { date: '2025-01-15', weight: 98 },
    { date: '2025-02-01', weight: 96 },
  ]

  it('computes chartData with dayNumber offsets', () => {
    const { result } = renderHook(() => useChartData(entries, '2025-01-01', '2025-04-01'))
    expect(result.current.chartData).toHaveLength(3)
    expect(result.current.chartData[0].dayNumber).toBe(0)
    expect(result.current.chartData[1].dayNumber).toBe(14)
    expect(result.current.chartData[2].dayNumber).toBe(31)
  })

  it('computes totalDays between start and target', () => {
    const { result } = renderHook(() => useChartData(entries, '2025-01-01', '2025-04-01'))
    expect(result.current.totalDays).toBe(90)
  })

  it('generates ticks at 14-day intervals', () => {
    const { result } = renderHook(() => useChartData(entries, '2025-01-01', '2025-03-01'))
    // 59 days: 0, 14, 28, 42, 56, 59
    expect(result.current.ticks[0]).toBe(0)
    expect(result.current.ticks[1]).toBe(14)
    expect(result.current.ticks[result.current.ticks.length - 1]).toBe(59)
  })

  it('formatXAxis returns Spanish formatted date', () => {
    const { result } = renderHook(() => useChartData(entries, '2025-01-01', '2025-04-01'))
    const formatted = result.current.formatXAxis(0)
    expect(formatted).toBe('1 ene')
  })
})
