'use client'

import { useAuth } from '@/lib/auth-context'
import { RoleSelector } from '@/components/auth/role-selector'
import { SecurityDashboard } from '@/components/dashboard/security-dashboard'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { SuperAdminDashboard } from '@/components/super-admin/super-admin-dashboard'
import { UsuarioDashboard } from '@/components/usuario/usuario-dashboard'

export function AppContainer() {
  const { user } = useAuth()

  // If no user is logged in, show role selector
  if (!user) {
    return <RoleSelector />
  }

  // Route based on user role
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
