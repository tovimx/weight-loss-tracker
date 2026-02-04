import { describe, it, expect } from 'vitest'
import { getGoalDirection, getWeightBounds, isWeightInRange } from '../validation'

describe('getGoalDirection', () => {
  it('returns loss when target < start', () => {
    expect(getGoalDirection(100, 80)).toBe('loss')
  })

  it('returns gain when target > start', () => {
    expect(getGoalDirection(60, 75)).toBe('gain')
  })
})

describe('getWeightBounds', () => {
  it('returns correct bounds for weight loss', () => {
    expect(getWeightBounds(100, 80)).toEqual({ min: 80, max: 100 })
  })

  it('returns correct bounds for weight gain', () => {
    expect(getWeightBounds(60, 75)).toEqual({ min: 60, max: 75 })
  })
})

describe('isWeightInRange', () => {
  it('accepts weight within loss range', () => {
    expect(isWeightInRange(90, 100, 80)).toBe(true)
  })

  it('rejects weight below loss range', () => {
    expect(isWeightInRange(75, 100, 80)).toBe(false)
  })

  it('rejects weight above loss range', () => {
    expect(isWeightInRange(105, 100, 80)).toBe(false)
  })

  it('accepts weight within gain range', () => {
    expect(isWeightInRange(65, 60, 75)).toBe(true)
  })

  it('accepts boundary values', () => {
    expect(isWeightInRange(80, 100, 80)).toBe(true)
    expect(isWeightInRange(100, 100, 80)).toBe(true)
  })
})
