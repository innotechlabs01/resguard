'use client'

import { useEffect } from 'react'

/**
 * Registers /sw.js (PWA shell + merged FCM handler, see public/sw.js).
 * Production only: caching in dev causes phantom-stale assets.
 */
export function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Registration failure is non-fatal; the app works without the SW.
    })
  }, [])

  return null
}
