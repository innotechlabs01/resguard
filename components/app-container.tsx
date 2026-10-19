'use client'

import { useAuth } from '@/lib/auth-context'
import { SecurityDashboard } from '@/components/dashboard/security-dashboard'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { SuperAdminDashboard } from '@/components/super-admin/super-admin-dashboard'
import { UsuarioDashboard } from '@/components/usuario/usuario-dashboard'
import { Spinner } from '@/components/ui/spinner'
import { ForcePasswordChange } from '@/components/auth/force-password-change'

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
      return null
  }
}

/**
 * Client dashboard shell for authenticated users. Anonymous visitors never
 * reach this component: app/page.tsx (Server Component) renders the landing
 * page instead when there is no session.
 */
export function AppContainer() {
  const { user, isLoaded } = useAuth()

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (!user) return null

  return (
    <>
      <DashboardByRole />
      <ForcePasswordChange />
    </>
  )
}
