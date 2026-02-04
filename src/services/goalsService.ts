import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'

export interface UserGoals {
  startWeight: number
  targetWeight: number
  startDate: string
  targetDate: string
}

export function subscribeToGoals(
  userId: string,
  callback: (goals: UserGoals | null) => void,
  onError?: (error: Error) => void
): () => void {
  const goalsRef = doc(db, 'users', userId, 'goals', 'current')

  return onSnapshot(
    goalsRef,
    (snapshot) => {
      // If the snapshot says "doesn't exist" but it's from cache,
      // skip it — wait for the server-confirmed result
      if (!snapshot.exists() && snapshot.metadata.fromCache) {
        return
      }

      if (snapshot.exists()) {
        callback(snapshot.data() as UserGoals)
      } else {
        callback(null)
      }
    },
    (error) => {
      console.error('Error fetching goals:', error)
      if (onError) {
        onError(error as Error)
      }
    }
  )
}

export async function getGoals(userId: string): Promise<UserGoals | null> {
  const goalsRef = doc(db, 'users', userId, 'goals', 'current')
  const snapshot = await getDoc(goalsRef)
  return snapshot.exists() ? (snapshot.data() as UserGoals) : null
}

export async function saveGoals(
  userId: string,
  goals: UserGoals
): Promise<void> {
  const goalsRef = doc(db, 'users', userId, 'goals', 'current')
  await setDoc(goalsRef, goals)
}
