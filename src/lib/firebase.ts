import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  enableIndexedDbPersistence,
} from 'firebase/firestore'
import {
  getAuth,
  GoogleAuthProvider,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyBKx78jGSzXnukNw2AS9ut71qRnhRGSWJg",
  authDomain: "weight-loss-tracker-f1374.firebaseapp.com",
  projectId: "weight-loss-tracker-f1374",
  storageBucket: "weight-loss-tracker-f1374.firebasestorage.app",
  messagingSenderId: "503867179400",
  appId: "1:503867179400:web:a0ce5fec3c415ad5443a3d",
  measurementId: "G-ZQRVWTJNBP"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Persistence failed: multiple tabs open')
  } else if (err.code === 'unimplemented') {
    console.warn('Persistence not supported by browser')
  }
})
