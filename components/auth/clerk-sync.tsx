'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect } from 'react'
import { userFromClerkLike } from '@/lib/auth/clerk-user'
import { useAuth } from '@/lib/auth-context'

/**
 * Cuando hay sesión de Clerk, refleja el usuario en el contexto compartido con el modo demo.
 */
export function ClerkSync() {
  const { user: clerkUser, isLoaded } = useUser()
  const { hydrateUser } = useAuth()

  useEffect(() => {
    if (!isLoaded) return
    if (!clerkUser) {
      hydrateUser(null)
      return
    }
    const primary = clerkUser.primaryEmailAddress?.emailAddress ?? null
    hydrateUser(
      userFromClerkLike({
        id: clerkUser.id,
        fullName: clerkUser.fullName,
        primaryEmail: primary,
        publicMetadata: (clerkUser.publicMetadata || {}) as Record<
          string,
          unknown
        >,
      })
    )
  }, [clerkUser, isLoaded, hydrateUser])

  return null
}
