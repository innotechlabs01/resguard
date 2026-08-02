'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { track } from '@vercel/analytics'
import type { User, UserRole } from '@/lib/types'

/**
 * When Clerk session exists, fetch user profile from database and hydrate auth context.
 * Falls back to Clerk metadata if DB lookup fails.
 */
export function ClerkSync() {
  const { user: clerkUser, isLoaded } = useUser()
  const { hydrateUser } = useAuth()
  const hasFetched = useRef(false)

  const trackUser = (appUser: User) => {
    track('User Identified', {
      userId: appUser.id,
      role: appUser.role,
      buildingId: appUser.buildingId || '',
      email: appUser.email,
      name: appUser.name,
    })

    if (typeof window !== 'undefined') {
      (window as any).__userContext__ = {
        userId: appUser.id,
        role: appUser.role,
        buildingId: appUser.buildingId,
        email: appUser.email,
        name: appUser.name,
      }
    }
  }

  useEffect(() => {
    if (!isLoaded) return
    if (!clerkUser) {
      hydrateUser(null)
      hasFetched.current = false
      return
    }

    // Prevent duplicate fetches
    if (hasFetched.current) return
    hasFetched.current = true

    // Fetch user profile from database
    fetch('/api/user/profile')
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json()
          const dbUser = data.user
          // Map DB user to app User type
          const appUser: User = {
            id: dbUser.id,
            clerkUserId: dbUser.clerk_user_id ?? undefined,
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role as UserRole,
            buildingId: dbUser.building_id ?? undefined,
          }
          hydrateUser(appUser)
          trackUser(appUser)
        } else {
          // User not found in DB, use Clerk data with default role
          const appUser: User = {
            id: clerkUser.id,
            clerkUserId: clerkUser.id,
            name: clerkUser.fullName || clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] || 'Usuario',
            email: clerkUser.primaryEmailAddress?.emailAddress || '',
            role: (clerkUser.publicMetadata?.role as UserRole) || 'usuario',
            buildingId: (clerkUser.publicMetadata?.buildingId as string) || undefined,
          }
          hydrateUser(appUser)
          trackUser(appUser)
        }
      })
      .catch(() => {
        // Network error, use Clerk data
        const appUser: User = {
          id: clerkUser.id,
          clerkUserId: clerkUser.id,
          name: clerkUser.fullName || clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] || 'Usuario',
          email: clerkUser.primaryEmailAddress?.emailAddress || '',
          role: (clerkUser.publicMetadata?.role as UserRole) || 'usuario',
          buildingId: (clerkUser.publicMetadata?.buildingId as string) || undefined,
        }
        hydrateUser(appUser)
        trackUser(appUser)
      })
  }, [clerkUser, isLoaded, hydrateUser])

  return null
}
