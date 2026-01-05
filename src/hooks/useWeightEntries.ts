import { useState, useEffect, useCallback } from 'react'
import type { WeightEntry } from '../services/weightService'
import {
  subscribeToWeightEntries,
  saveWeightEntry,
  deleteWeightEntry,
  migrateFromLocalStorage,
} from '../services/weightService'

export function useWeightEntries(userId: string | undefined) {
  const [entries, setEntries] = useState<WeightEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userId) {
      setEntries([])
      setLoading(false)
      return
    }

    setLoading(true)

    // First, migrate any localStorage data
    migrateFromLocalStorage(userId).catch(console.error)

    // Subscribe to real-time updates
    const unsubscribe = subscribeToWeightEntries(userId, (newEntries) => {
      setEntries(newEntries)
      setLoading(false)
    })

    return unsubscribe
  }, [userId])

  const addEntry = useCallback(
    async (entry: WeightEntry) => {
      if (!userId) throw new Error('Not authenticated')
      try {
        await saveWeightEntry(userId, entry)
      } catch (err) {
        setError(err as Error)
        throw err
      }
    },
    [userId]
  )

  const removeEntry = useCallback(
    async (date: string) => {
      if (!userId) throw new Error('Not authenticated')
      try {
        await deleteWeightEntry(userId, date)
      } catch (err) {
        setError(err as Error)
        throw err
      }
    },
    [userId]
  )

  return { entries, loading, error, addEntry, removeEntry }
}
