import { useState, useEffect, useCallback } from 'react'
import type { UserGoals } from '../services/goalsService'
import {
  subscribeToGoals,
  getGoalsFromServer,
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
    let serverConfirmedNull = false

    const unsubscribe = subscribeToGoals(
      userId,
      (newGoals) => {
        if (newGoals !== null) {
          // Goals found — trust it whether from cache or server
          setGoals(newGoals)
          setLoading(false)
          setError(null)
        } else if (serverConfirmedNull) {
          // Server already confirmed no goals exist (e.g. user deleted them)
          setGoals(null)
          setLoading(false)
        } else {
          // Subscription says no goals, but this could be a stale/empty cache.
          // Verify with a forced server read before showing GoalSetup.
          getGoalsFromServer(userId)
            .then((serverGoals) => {
              serverConfirmedNull = serverGoals === null
              setGoals(serverGoals)
              setLoading(false)
            })
            .catch((fetchErr) => {
              console.error('Server verification failed:', fetchErr)
              // If server read fails (offline, etc.), accept the null
              setGoals(null)
              setLoading(false)
            })
        }
      },
      (err) => {
        // Subscription failed (likely permissions) — fallback to server read
        getGoalsFromServer(userId)
          .then((fetchedGoals) => {
            setGoals(fetchedGoals)
            setLoading(false)
          })
          .catch((fetchErr) => {
            console.error('Fallback getGoalsFromServer also failed:', fetchErr)
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
      // Set goals locally so we don't depend on the subscription picking it up
      setGoals(newGoals)
      setError(null)
    },
    [userId]
  )

  return { goals, loading, error, saveGoals }
}
