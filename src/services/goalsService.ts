import { doc, setDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'

export interface UserGoals {
  startWeight: number
  targetWeight: number
  startDate: string
  targetDate: string
}

export function subscribeToGoals(
  userId: string,
  callback: (goals: UserGoals | null) => void
): () => void {
  const goalsRef = doc(db, 'users', userId, 'goals', 'current')

  return onSnapshot(
    goalsRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as UserGoals)
      } else {
        callback(null)
      }
    },
    (error) => {
      console.error('Error fetching goals:', error)
      callback(null)
    }
  )
}

export async function saveGoals(
  userId: string,
  goals: UserGoals
): Promise<void> {
  const goalsRef = doc(db, 'users', userId, 'goals', 'current')
  await setDoc(goalsRef, goals)
}
