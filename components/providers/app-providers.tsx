'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { AuthProvider } from '@/lib/auth-context'

type Props = { children: React.ReactNode }

export function AppProviders({ children }: Props) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="resguard-theme"
    >
      <AuthProvider>{children}</AuthProvider>
    </NextThemesProvider>
  )
}
