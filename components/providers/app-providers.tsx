'use client'

import { ClerkProvider, useClerk } from '@clerk/nextjs'
import { AuthProvider } from '@/lib/auth-context'
import { ClerkSync } from '@/components/auth/clerk-sync'

type Props = { children: React.ReactNode }

function ClerkAuthBridge({ children }: Props) {
  const { signOut } = useClerk()
  return (
    <AuthProvider onLogoutExtra={() => signOut()}>
      <ClerkSync />
      {children}
    </AuthProvider>
  )
}

export function AppProviders({ children }: Props) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim()

  if (publishableKey) {
    return (
      <ClerkProvider publishableKey={publishableKey}>
        <ClerkAuthBridge>{children}</ClerkAuthBridge>
      </ClerkProvider>
    )
  }

  return <AuthProvider>{children}</AuthProvider>
}
