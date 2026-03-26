'use client'

import { useAuthStore } from '@/store/auth-store'
import { SplashScreen } from '@/components/splash-screen'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { status } = useAuthStore()
  const router = useRouter()

  // Redirect based on auth status
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/') // Home/dashboard
    } else if (status === 'unauthenticated') {
      router.push('/sign-in')
    }
  }, [status, router])

  if (status === 'loading') {
    return <SplashScreen />
  }

  return children
}