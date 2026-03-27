'use client'

import dynamic from 'next/dynamic'

const ClerkSignInShell = dynamic(
  () => import('@/components/auth/clerk-sign-in-shell').then(mod => mod.ClerkSignInShell),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    ),
  }
)

export default function SignInPage() {
  return <ClerkSignInShell />
}
