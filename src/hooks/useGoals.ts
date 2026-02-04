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
    let resolved = false

    const unsubscribe = subscribeToGoals(
      userId,
      (newGoals) => {
        resolved = true
        setGoals(newGoals)
        setLoading(false)
        setError(null)
      },
      (err) => {
        resolved = true
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

    // Safety net: if subscription hasn't resolved (e.g. offline with empty cache),
    // fall back to a one-time read after a short delay
    const timeout = setTimeout(() => {
      if (!resolved) {
        getGoals(userId)
          .then((fetchedGoals) => {
            if (!resolved) {
              resolved = true
              setGoals(fetchedGoals)
              setLoading(false)
            }
          })
          .catch(() => {
            // One-time read also failed — subscription may still resolve later
          })
      }
    }, 3000)

    return () => {
      clearTimeout(timeout)
      unsubscribe()
    }
  }, [userId])

  const saveGoals = useCallback(
    async (newGoals: UserGoals) => {
      if (!userId) throw new Error('Not authenticated')
      await saveGoalsService(userId, newGoals)
      // Set goals locally so we don't depend on the subscription picking it up
      setGoals(newGoals)
      setError(null)
    },
    [userId]
  )

  return { goals, loading, error, saveGoals }
}
