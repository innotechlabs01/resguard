'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminSidebar } from './admin-sidebar'
import { AdminHeader } from './admin-header'
import { AdminOverview } from './admin-overview'
import { ResidentsPanel } from './residents-panel'
import { PaymentsPanel } from './payments-panel'
import { AdminSettingsPanel } from './admin-settings-panel'
import { ComunicacionesPanel } from './comunicaciones-panel'
import { ParkingManagementPanel } from './parking-management-panel'
import { ParkingMap } from '@/components/dashboard/parking-map'
import { AlertsPanel } from '@/components/dashboard/alerts-panel'
import { ReportsPanel } from '@/components/dashboard/reports-panel'
import {
  mockParkingSpots,
  mockAlerts,
  mockBuildingStats,
} from '@/lib/mock-data'
import type { ParkingSpot, Alert, BuildingStats } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'

const tabTitles: Record<string, string> = {
  overview: 'Dashboard del Edificio',
  residents: 'Gestion de Residentes',
  parking: 'Parqueaderos Residentes',
  visitorParking: 'Parqueadero Visitantes',
  payments: 'Pagos y Cobros',
  comunicaciones: 'Comunicaciones',
  alerts: 'Alertas',
  reports: 'Reportes',
  settings: 'Configuracion',
}

export function AdminDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>(mockParkingSpots)
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts)
  const [building, setBuilding] = useState<BuildingStats | null>(null)

  useEffect(() => {
    // Get building stats for the admin's building
    const buildingData = mockBuildingStats.find((b) => b.id === user?.buildingId)
    setBuilding(buildingData || mockBuildingStats[0])
  }, [user?.buildingId])

  const unreadAlerts = alerts.filter((a) => !a.read).length

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'F1') {
      e.preventDefault()
      setActiveTab('residents')
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

  const handleSpotUpdate = (spotId: string, updates: Partial<ParkingSpot>) => {
    setParkingSpots((spots) =>
      spots.map((spot) => (spot.id === spotId ? { ...spot, ...updates } : spot))
    )
  }

  const handleMarkAlertRead = (alertId: string) => {
    setAlerts((alerts) =>
      alerts.map((a) => (a.id === alertId ? { ...a, read: true } : a))
    )
  }

  const handleMarkAllAlertsRead = () => {
    setAlerts((alerts) => alerts.map((a) => ({ ...a, read: true })))
  }

  const handleDismissAlert = (alertId: string) => {
    setAlerts((alerts) => alerts.filter((a) => a.id !== alertId))
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return building ? (
          <AdminOverview
            building={building}
            parkingSpots={parkingSpots}
            alerts={alerts}
          />
        ) : null
      case 'residents':
        return <ResidentsPanel />
      case 'parking':
        return <ParkingManagementPanel />
      case 'visitorParking':
        return <ParkingMap parkingSpots={parkingSpots} onSpotUpdate={handleSpotUpdate} />
      case 'payments':
        return <PaymentsPanel />
      case 'comunicaciones':
        return <ComunicacionesPanel />
      case 'alerts':
        return (
          <AlertsPanel
            alerts={alerts}
            onMarkAsRead={handleMarkAlertRead}
            onMarkAllRead={handleMarkAllAlertsRead}
            onDismiss={handleDismissAlert}
          />
        )
      case 'reports':
        return <ReportsPanel />
      case 'settings':
        return building ? <AdminSettingsPanel building={building} /> : null
      default:
        return null
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unreadAlerts={unreadAlerts}
        buildingName={building?.name || 'Cargando...'}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader
          title={tabTitles[activeTab]}
          unreadAlerts={unreadAlerts}
          buildingName={building?.name || ''}
        />
        <main className="flex-1 overflow-auto p-6">{renderContent()}</main>
      </div>
    </div>
  )
}
