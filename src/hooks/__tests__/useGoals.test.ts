import { describe, it, expect, vi, beforeEach } from 'vitest'
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
const mockGetGoalsFromServer = vi.fn()
const mockSaveGoals = vi.fn()

vi.mock('../../services/goalsService', () => ({
  subscribeToGoals: (...args: unknown[]) => mockSubscribe(...args),
  getGoalsFromServer: (...args: unknown[]) => mockGetGoalsFromServer(...args),
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

  it('subscribes and returns goals when they exist', async () => {
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

  it('verifies with server when subscription returns null, server has goals', async () => {
    // Simulate: subscription fires null (empty cache), but server has goals
    mockSubscribe.mockImplementation((_userId: string, cb: (goals: UserGoals | null) => void) => {
      cb(null)
      return () => {}
    })
    mockGetGoalsFromServer.mockResolvedValue(mockGoals)

    const { result } = renderHook(() => useGoals('user1'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    // Should have fetched from server and found goals
    expect(mockGetGoalsFromServer).toHaveBeenCalledWith('user1')
    expect(result.current.goals).toEqual(mockGoals)
  })

  it('accepts null when server confirms no goals exist', async () => {
    mockSubscribe.mockImplementation((_userId: string, cb: (goals: UserGoals | null) => void) => {
      cb(null)
      return () => {}
    })
    mockGetGoalsFromServer.mockResolvedValue(null)

    const { result } = renderHook(() => useGoals('user1'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(mockGetGoalsFromServer).toHaveBeenCalledWith('user1')
    expect(result.current.goals).toBeNull()
  })

  it('accepts null when server verification fails (offline)', async () => {
    mockSubscribe.mockImplementation((_userId: string, cb: (goals: UserGoals | null) => void) => {
      cb(null)
      return () => {}
    })
    mockGetGoalsFromServer.mockRejectedValue(new Error('offline'))

    const { result } = renderHook(() => useGoals('user1'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.goals).toBeNull()
  })

  it('falls back to server read on subscription error', async () => {
    mockSubscribe.mockImplementation(
      (_userId: string, _cb: unknown, onErr: (err: Error) => void) => {
        onErr(new Error('permission denied'))
        return () => {}
      }
    )
    mockGetGoalsFromServer.mockResolvedValue(mockGoals)

    const { result } = renderHook(() => useGoals('user1'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.goals).toEqual(mockGoals)
  })

  it('sets error when both subscription and server fallback fail', async () => {
    const err = new Error('permission denied')
    mockSubscribe.mockImplementation(
      (_userId: string, _cb: unknown, onErr: (err: Error) => void) => {
        onErr(err)
        return () => {}
      }
    )
    mockGetGoalsFromServer.mockRejectedValue(new Error('also failed'))

    const { result } = renderHook(() => useGoals('user1'))

    await waitFor(() => {
      expect(result.current.error).toBe(err)
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
