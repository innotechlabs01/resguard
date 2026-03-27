'use client'

import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/lib/auth-context'
import { LandingPage } from '@/components/auth/landing-page'
import { SecurityDashboard } from '@/components/dashboard/security-dashboard'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { SuperAdminDashboard } from '@/components/super-admin/super-admin-dashboard'
import { UsuarioDashboard } from '@/components/usuario/usuario-dashboard'
import { Spinner } from '@/components/ui/spinner'

function hasClerkKey() {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim().length)
}

function DashboardByRole() {
  const { user } = useAuth()
  if (!user) return null
  switch (user.role) {
    case 'super_admin':
      return <SuperAdminDashboard />
    case 'admin':
      return <AdminDashboard />
    case 'vigilante':
      return <SecurityDashboard />
    case 'usuario':
      return <UsuarioDashboard />
    default:
      return <LandingPage />
  }
}

/** App container with Clerk: show loading, landing page, or dashboard. */
function AppContainerWithClerk() {
  const { user } = useAuth()
  const { isLoaded, isSignedIn } = useUser()

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Spinner className="h-6 w-6" />
          <p className="text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  // Show dashboard if user exists (demo mode) OR if Clerk is signed in
  if (user) {
    return <DashboardByRole />
  }

  if (isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Spinner className="h-6 w-6" />
          <p className="text-sm">Preparando tu perfil...</p>
        </div>
      </div>
    )
  }

  // Show landing page for not signed in
  return <LandingPage />
}

/** App container without Clerk: always show landing page (demo mode). */
function AppContainerWithoutClerk() {
  const { user } = useAuth()
  if (user) {
    return <DashboardByRole />
  }
  return <LandingPage />
}

export function AppContainer() {
  if (hasClerkKey()) {
    return <AppContainerWithClerk />
  }
  return <AppContainerWithoutClerk />
}
