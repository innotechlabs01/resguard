'use client'

import { useEffect, useRef } from 'react'
import { track } from '@vercel/analytics'
import { useAuth } from '@/lib/auth-context'
import type { UserRole } from '@/lib/types'

interface TrackModuleOptions {
  module: string
  page: string
}

export function useAnalyticsTrack(currentModule: string, page: string) {
  const { user } = useAuth()
  const prevModuleRef = useRef<string>('')

  useEffect(() => {
    if (!currentModule || currentModule === prevModuleRef.current) return
    
    prevModuleRef.current = currentModule

    track('Module View', {
      module: currentModule,
      page: page,
      role: user?.role || 'unknown',
      buildingId: user?.buildingId || '',
      userId: user?.id || '',
    })
  }, [currentModule, page, user])
}

export function trackAction(action: string, details?: Record<string, string | number | boolean>) {
  const userContext = typeof window !== 'undefined' 
    ? (window as any).__userContext__ 
    : null

  track('Action Performed', {
    action: action,
    role: userContext?.role || 'unknown',
    buildingId: userContext?.buildingId || '',
    userId: userContext?.userId || '',
    ...details,
  })
}

export function trackError(error: string, details?: Record<string, string>) {
  const userContext = typeof window !== 'undefined' 
    ? (window as any).__userContext__ 
    : null

  track('Error Occurred', {
    error: error,
    role: userContext?.role || 'unknown',
    buildingId: userContext?.buildingId || '',
    userId: userContext?.userId || '',
    url: typeof window !== 'undefined' ? window.location.href : '',
    ...details,
  })
}
