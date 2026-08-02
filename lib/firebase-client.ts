'use client'

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getMessaging, getToken, Messaging, onMessage } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY

let app: FirebaseApp | undefined
let messaging: Messaging | undefined

export function getFirebaseApp(): FirebaseApp {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig)
  }
  return app || getApps()[0]
}

export async function getFcmToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null

  if (!VAPID_KEY || VAPID_KEY === 'tu_vapid_key' || VAPID_KEY.length < 10) {
    return null
  }

  try {
    const permission = await Notification.permission
    if (permission !== 'granted') {
      return null
    }

    const firebaseApp = getFirebaseApp()
    messaging = getMessaging(firebaseApp)

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
    })

    return token
  } catch (error: any) {
    return null
  }
}

export function onForegroundMessage(callback: (payload: any) => void) {
  if (typeof window === 'undefined') return () => {}

  if (!VAPID_KEY || VAPID_KEY === 'tu_vapid_key') {
    return () => {}
  }

  try {
    const firebaseApp = getFirebaseApp()
    messaging = getMessaging(firebaseApp)

    return onMessage(messaging, (payload) => {
      callback(payload)
    })
  } catch (error) {
    return () => {}
  }
}
