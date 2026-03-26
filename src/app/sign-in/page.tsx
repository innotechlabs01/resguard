'use client'

import { ClerkSignInShell } from '@/components/auth/clerk-sign-in-shell'
import { useAuthStore } from '@/store/auth-store'
import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import type { User, UserRole } from '@/lib/types'
import { userFromClerkEnhanced } from '@/lib/auth/clerk-utils'

export default function SignInPage() {
  const { user } = useUser()
  const { setUser, setStatus } = useAuthStore()

  useEffect(() => {
    if (user) {
      // Map Clerk user to your app's User type using the enhanced function
      // This uses the actual Clerk user ID and extracts role from public metadata
      const appUser = userFromClerkEnhanced(user)
      
      setUser(appUser)
      setStatus('authenticated')
    } else {
      setStatus('unauthenticated')
    }
  }, [user, setUser, setStatus])

  return <ClerkSignInShell />
}