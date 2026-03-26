'use client'

import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/lib/auth-context'
import { RoleSelector } from '@/components/auth/role-selector'
import { ClerkSignInShell } from '@/components/auth/clerk-sign-in-shell'
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
      return <RoleSelector />
  }
}

/** Flujo con Clerk: pantalla de inicio de sesión real o paneles según rol. */
function AppContainerClerk() {
  const { user } = useAuth()
  const { isLoaded, isSignedIn } = useUser()

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Spinner className="h-8 w-8 text-primary" />
          <p className="text-sm">Cargando sesión…</p>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return <ClerkSignInShell />
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Spinner className="h-8 w-8 text-primary" />
          <p className="text-sm">Preparando tu perfil…</p>
        </div>
      </div>
    )
  }

  return <DashboardByRole />
}

/** Flujo demo: selector de rol y usuarios de ejemplo (sin Clerk). */
function AppContainerMock() {
  const { user } = useAuth()
  if (!user) {
    return <RoleSelector />
  }
  return <DashboardByRole />
}

export function AppContainer() {
  if (hasClerkKey()) {
    return <AppContainerClerk />
  }
  return <AppContainerMock />
}
