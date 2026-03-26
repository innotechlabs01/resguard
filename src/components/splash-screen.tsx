'use client'

import { Spinner } from '@/components/ui/spinner'

export function SplashScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <Spinner className="h-8 w-8" />
        <p className="mt-4 text-muted-foreground">Checking authentication...</p>
      </div>
    </div>
  )
}