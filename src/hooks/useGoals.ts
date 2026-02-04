import { useState, useEffect, useCallback } from 'react'
import type { UserGoals } from '../services/goalsService'
import {
  subscribeToGoals,
  getGoals,
  saveGoals as saveGoalsService,
} from '../services/goalsService'

export function useGoals(userId: string | undefined) {
  const [goals, setGoals] = useState<UserGoals | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userId) {
      setGoals(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const unsubscribe = subscribeToGoals(
      userId,
      (newGoals) => {
        setGoals(newGoals)
        setLoading(false)
        setError(null)
      },
      (err) => {
        // Subscription failed (likely permissions) — fallback to one-time read
        getGoals(userId)
          .then((fetchedGoals) => {
            setGoals(fetchedGoals)
            setLoading(false)
          })
          .catch((fetchErr) => {
            console.error('Fallback getGoals also failed:', fetchErr)
            setError(err)
            setLoading(false)
          })
      }
    )

    return unsubscribe
  }, [userId])

  const saveGoals = useCallback(
    async (newGoals: UserGoals) => {
      if (!userId) throw new Error('Not authenticated')
      await saveGoalsService(userId, newGoals)
    },
    [userId]
  )

  return { goals, loading, error, saveGoals }
}
