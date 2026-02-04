import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useGoals } from '../useGoals'
import type { UserGoals } from '../../services/goalsService'

const mockGoals: UserGoals = {
  startWeight: 100,
  targetWeight: 80,
  startDate: '2025-01-01',
  targetDate: '2025-06-01',
}

const mockSubscribe = vi.fn()
const mockGetGoals = vi.fn()
const mockSaveGoals = vi.fn()

vi.mock('../../services/goalsService', () => ({
  subscribeToGoals: (...args: unknown[]) => mockSubscribe(...args),
  getGoals: (...args: unknown[]) => mockGetGoals(...args),
  saveGoals: (...args: unknown[]) => mockSaveGoals(...args),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockSubscribe.mockReturnValue(() => {})
})

describe('useGoals', () => {
  it('returns null goals when no userId', () => {
    const { result } = renderHook(() => useGoals(undefined))
    expect(result.current.goals).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('subscribes and returns goals', async () => {
    mockSubscribe.mockImplementation((_userId: string, cb: (goals: UserGoals) => void) => {
      cb(mockGoals)
      return () => {}
    })

    const { result } = renderHook(() => useGoals('user1'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.goals).toEqual(mockGoals)
  })

  it('falls back to getGoals on subscription error', async () => {
    mockSubscribe.mockImplementation(
      (_userId: string, _cb: unknown, onErr: (err: Error) => void) => {
        onErr(new Error('permission denied'))
        return () => {}
      }
    )
    mockGetGoals.mockResolvedValue(mockGoals)

    const { result } = renderHook(() => useGoals('user1'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.goals).toEqual(mockGoals)
  })

  it('sets error when both subscription and fallback fail', async () => {
    const err = new Error('permission denied')
    mockSubscribe.mockImplementation(
      (_userId: string, _cb: unknown, onErr: (err: Error) => void) => {
        onErr(err)
        return () => {}
      }
    )
    mockGetGoals.mockRejectedValue(new Error('also failed'))

    const { result } = renderHook(() => useGoals('user1'))

    await waitFor(() => {
      expect(result.current.error).toBe(err)
    })
  })

  describe('cache race condition (fake timers)', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('stays in loading state when subscription never resolves, then timeout triggers fallback', async () => {
      // Simulate the cache race condition: subscription callback is never called
      // (because goalsService skips empty-from-cache snapshots)
      mockSubscribe.mockReturnValue(() => {})
      mockGetGoals.mockResolvedValue(mockGoals)

      const { result } = renderHook(() => useGoals('user1'))

      // Should still be loading since subscription hasn't resolved
      expect(result.current.loading).toBe(true)
      expect(result.current.goals).toBeNull()

      // Advance past the 3s safety net timeout and flush microtasks
      await act(async () => {
        vi.advanceTimersByTime(3000)
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.goals).toEqual(mockGoals)
      expect(mockGetGoals).toHaveBeenCalledWith('user1')
    })

    it('does not apply timeout fallback if subscription already resolved', async () => {
      mockSubscribe.mockImplementation((_userId: string, cb: (goals: UserGoals) => void) => {
        cb(mockGoals)
        return () => {}
      })
      mockGetGoals.mockResolvedValue(null)

      const { result } = renderHook(() => useGoals('user1'))

      expect(result.current.loading).toBe(false)
      expect(result.current.goals).toEqual(mockGoals)

      // Advance past timeout — getGoals should NOT be called
      await act(async () => {
        vi.advanceTimersByTime(3000)
      })

      expect(mockGetGoals).not.toHaveBeenCalled()
    })
  })

  it('saveGoals updates local state', async () => {
    mockSubscribe.mockImplementation((_userId: string, cb: (goals: UserGoals) => void) => {
      cb(mockGoals)
      return () => {}
    })
    mockSaveGoals.mockResolvedValue(undefined)

    const { result } = renderHook(() => useGoals('user1'))

    await waitFor(() => {
      expect(result.current.goals).toEqual(mockGoals)
    })

    const newGoals: UserGoals = { ...mockGoals, targetWeight: 75 }
    await act(async () => {
      await result.current.saveGoals(newGoals)
    })

    expect(result.current.goals).toEqual(newGoals)
  })
})
