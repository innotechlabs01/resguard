'use client'

import { AuthProvider } from '@/lib/auth-context'

type Props = { children: React.ReactNode }

export function AppProviders({ children }: Props) {
  return <AuthProvider>{children}</AuthProvider>
}
