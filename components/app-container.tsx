'use client'

import { useAuth } from '@/lib/auth-context'
import { LandingPage } from '@/components/auth/landing-page'
import { SecurityDashboard } from '@/components/dashboard/security-dashboard'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { SuperAdminDashboard } from '@/components/super-admin/super-admin-dashboard'
import { UsuarioDashboard } from '@/components/usuario/usuario-dashboard'
import { Spinner } from '@/components/ui/spinner'

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

/** App container with Supabase Auth: show loading, landing page, or dashboard. */
function AppContainerWithAuth() {
  const { user } = useAuth()

  if (!user) {
    return <LandingPage />
  }

  return <DashboardByRole />
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
  return <AppContainerWithAuth />
}
