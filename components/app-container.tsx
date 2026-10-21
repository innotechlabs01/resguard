'use client'

import { useAuth } from '@/lib/auth-context'
import { SecurityDashboard } from '@/components/dashboard/security-dashboard'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { SuperAdminDashboard } from '@/components/super-admin/super-admin-dashboard'
import { UsuarioDashboard } from '@/components/usuario/usuario-dashboard'
import { Spinner } from '@/components/ui/spinner'
import { ForcePasswordChange } from '@/components/auth/force-password-change'
import { PWAInstallPrompt } from '@/components/pwa/install-prompt'
import { OfflineBanner } from '@/components/pwa/offline-banner'
import { Toaster } from 'sonner'

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
      <OfflineBanner />
      <DashboardByRole />
      <ForcePasswordChange />
      <PWAInstallPrompt />
      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{
          duration: 4000,
          style: {
            fontSize: '14px',
          },
        }}
      />
    </>
  )
}
