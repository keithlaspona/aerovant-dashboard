import { initializeApp, getApps, getApp } from "firebase/app"
import {
  getDatabase as getFirebaseDB,
  ref,
  push,
  set,
  get,
  query,
  orderByKey,
  limitToLast,
  remove,
  update,
} from "firebase/database"

const firebaseConfig = {
  apiKey: "AIzaSyCUqf89RnbMr0TiqQ4Q0JpSKjlPWkYlHDo",
  authDomain: "aerovant-monitoring.firebaseapp.com",
  projectId: "aerovant-monitoring",
  storageBucket: "aerovant-monitoring.firebasestorage.app",
  messagingSenderId: "313837449850",
  appId: "1:313837449850:web:50fbfa3c4dc72301be01c3",
  databaseURL: "https://aerovant-monitoring-default-rtdb.asia-southeast1.firebasedatabase.app",
}

// Initialize Firebase client
let firebaseApp = null
try {
  firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
} catch (error) {
  console.log("[v0] Firebase app initialization error:", error)
}

let database: ReturnType<typeof getFirebaseDB> | null = null
let dbError: Error | null = null

function getDatabase() {
  if (dbError) {
    throw dbError
  }

  if (!database && firebaseApp) {
    try {
      database = getFirebaseDB(firebaseApp)
    } catch (error) {
      dbError = new Error("Firebase database service not available. Check your credentials.")
      console.log("[v0] Firebase database service not available:", error)
      throw dbError
    }
  }

  if (!database) {
    throw new Error("Firebase app not initialized")
  }

  return database
}

export { getDatabase, ref, push, set, get, query, orderByKey, limitToLast, remove, update }
