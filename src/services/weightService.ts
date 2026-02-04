import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

export interface WeightEntry {
  date: string
  weight: number
}

export function subscribeToWeightEntries(
  userId: string,
  callback: (entries: WeightEntry[]) => void
): () => void {
  const entriesRef = collection(db, 'users', userId, 'entries')
  const q = query(entriesRef, orderBy('date', 'asc'))

  return onSnapshot(
    q,
    (snapshot) => {
      // Skip empty results from cache — wait for server confirmation
      if (snapshot.empty && snapshot.metadata.fromCache) {
        return
      }

      const entries: WeightEntry[] = []
      snapshot.forEach((doc) => {
        entries.push(doc.data() as WeightEntry)
      })
      callback(entries)
    },
    (error) => {
      console.error('Error fetching entries:', error)
    }
  )
}

export async function saveWeightEntry(
  userId: string,
  entry: WeightEntry
): Promise<void> {
  const entryRef = doc(db, 'users', userId, 'entries', entry.date)
  await setDoc(entryRef, entry)
}

export async function deleteWeightEntry(
  userId: string,
  date: string
): Promise<void> {
  const entryRef = doc(db, 'users', userId, 'entries', date)
  await deleteDoc(entryRef)
}

// Migration function: import localStorage data to Firestore
export async function migrateFromLocalStorage(userId: string): Promise<void> {
  const saved = localStorage.getItem('weightEntries')
  if (!saved) return

  const entries: WeightEntry[] = JSON.parse(saved)
  if (entries.length === 0) return

  const batch = writeBatch(db)
  entries.forEach((entry) => {
    const entryRef = doc(db, 'users', userId, 'entries', entry.date)
    batch.set(entryRef, entry)
  })

  await batch.commit()
  localStorage.removeItem('weightEntries') // Clean up after migration
}
