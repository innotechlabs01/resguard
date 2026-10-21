'use client'

import { useEffect, useState } from 'react'
import { WifiOff, Wifi } from 'lucide-react'

/**
 * Offline indicator: shows a banner when the user loses connection.
 * Reuses the service worker's network-first strategy (no sensitive data cached).
 */
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    const handleOffline = () => setIsOffline(true)
    const handleOnline = () => setIsOffline(false)

    // Set initial state
    setIsOffline(!navigator.onLine)

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[70] bg-warning text-warning-foreground text-center text-sm font-medium py-2 px-4"
    >
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span>Sin conexión — Los cambios se guardarán cuando vuelvas a tener internet</span>
      </div>
    </div>
  )
}
