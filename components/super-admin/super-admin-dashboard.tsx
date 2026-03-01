'use client'

import { useState, useEffect, useCallback } from 'react'
import { SuperAdminSidebar } from './super-admin-sidebar'
import { SuperAdminHeader } from './super-admin-header'
import { SuperAdminOverview } from './super-admin-overview'
import { BuildingsPanel } from './buildings-panel'
import { GlobalPaymentsPanel } from './global-payments-panel'
import { UsersPanel } from './users-panel'
import { AnalyticsPanel } from './analytics-panel'
import { SystemAlertsPanel } from './system-alerts-panel'
import { SystemSettingsPanel } from './system-settings-panel'
import { ParkingConfigPanel } from './parking-config-panel'
import {
  mockBuildingStats,
  mockSystemStats,
} from '@/lib/mock-data'

const tabTitles: Record<string, string> = {
  overview: 'Dashboard Global',
  buildings: 'Gestion de Edificios',
  parking: 'Configuracion Parqueaderos',
  payments: 'Pagos y Facturacion',
  users: 'Gestion de Usuarios',
  analytics: 'Analiticas del Sistema',
  alerts: 'Alertas del Sistema',
  settings: 'Configuracion del Sistema',
}

export function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'F1') {
      e.preventDefault()
      setActiveTab('buildings')
    } else if (e.key === 'F2') {
      e.preventDefault()
      setActiveTab('payments')
    } else if (e.key === 'F3') {
      e.preventDefault()
      setActiveTab('alerts')
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <SuperAdminOverview
            systemStats={mockSystemStats}
            buildings={mockBuildingStats}
          />
        )
      case 'buildings':
        return <BuildingsPanel buildings={mockBuildingStats} />
      case 'parking':
        return <ParkingConfigPanel />
      case 'payments':
        return <GlobalPaymentsPanel />
      case 'users':
        return <UsersPanel />
      case 'analytics':
        return <AnalyticsPanel />
      case 'alerts':
        return <SystemAlertsPanel />
      case 'settings':
        return <SystemSettingsPanel />
      default:
        return null
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <SuperAdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        systemAlerts={mockSystemStats.systemAlerts}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <SuperAdminHeader
          title={tabTitles[activeTab]}
          systemAlerts={mockSystemStats.systemAlerts}
        />
        <main className="flex-1 overflow-auto p-6">{renderContent()}</main>
      </div>
    </div>
  )
}
