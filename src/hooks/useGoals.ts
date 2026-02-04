import { useState, useEffect, useCallback } from 'react'
import type { UserGoals } from '../services/goalsService'
import {
  subscribeToGoals,
  saveGoals as saveGoalsService,
} from '../services/goalsService'

export function useGoals(userId: string | undefined) {
  const [goals, setGoals] = useState<UserGoals | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setGoals(null)
      setLoading(false)
      return
    }

    setLoading(true)

    const unsubscribe = subscribeToGoals(userId, (newGoals) => {
      setGoals(newGoals)
      setLoading(false)
    })

    return unsubscribe
  }, [userId])

  const saveGoals = useCallback(
    async (newGoals: UserGoals) => {
      if (!userId) throw new Error('Not authenticated')
      await saveGoalsService(userId, newGoals)
    },
    [userId]
  )

  return { goals, loading, saveGoals }
}
