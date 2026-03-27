'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
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
import type { BuildingStats, SystemStats } from '@/lib/types'

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
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [buildings, setBuildings] = useState<BuildingStats[]>([])
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch data from API
  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      try {
        const [buildingsRes, statsRes, usersRes] = await Promise.all([
          fetch('/api/buildings'),
          fetch('/api/stats'),
          fetch('/api/users'),
        ])
        if (!cancelled && buildingsRes.ok) {
          const data = await buildingsRes.json()
          // Map DB buildings to BuildingStats type
          const mapped: BuildingStats[] = (data.buildings || []).map((b: any) => ({
            id: b.id,
            name: b.name,
            address: b.address,
            totalUnits: b.total_units,
            occupiedUnits: 0,
            totalParkingSpots: b.total_parking_spots,
            visitorParkingSpots: b.visitor_parking_spots,
            monthlyRevenue: b.monthly_fee || 0,
            outstandingBalance: b.outstanding_balance || 0,
            lastPaymentDate: b.last_payment_date ? new Date(b.last_payment_date) : undefined,
            subscriptionStatus: b.subscription_status || 'active',
            activeVisitors: 0,
            pendingAlerts: 0,
            status: 'active' as const,
          }))
          setBuildings(mapped)
        }
        if (!cancelled && statsRes.ok) {
          const data = await statsRes.json()
          if (data.stats) {
            setSystemStats({
              totalBuildings: data.stats.total_buildings || 0,
              activeBuildings: data.stats.active_buildings || 0,
              totalResidents: data.stats.total_residents || 0,
              totalRevenue: data.stats.total_revenue || 0,
              monthlyRecurringRevenue: data.stats.monthly_recurring_revenue || 0,
              pendingPayments: data.stats.pending_payments || 0,
              systemAlerts: data.stats.system_alerts || 0,
            })
          }
        }

        if (!cancelled && usersRes.ok) {
          const data = await usersRes.json()
          setUsers(data.users || [])
        }
      } catch (error) {
        console.error('Error fetching super admin data:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (user && user.clerkUserId) {
      fetchData()
    } else {
      setLoading(false)
    }
    return () => { cancelled = true }
  }, [user])

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

  const defaultStats: SystemStats = {
    totalBuildings: 0,
    activeBuildings: 0,
    totalResidents: 0,
    totalRevenue: 0,
    monthlyRecurringRevenue: 0,
    pendingPayments: 0,
    systemAlerts: 0,
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando datos...</p>
      </div>
    )
  }

  const renderContent = () => {
    const stats = systemStats || defaultStats
    switch (activeTab) {
      case 'overview':
        return (
          <SuperAdminOverview
            systemStats={stats}
            buildings={buildings}
          />
        )
      case 'buildings':
        return <BuildingsPanel buildings={buildings} />
      case 'parking':
        return <ParkingConfigPanel />
      case 'payments':
        return <GlobalPaymentsPanel />
      case 'users':
        return <UsersPanel users={users} buildings={buildings} />
      case 'analytics':
        return <AnalyticsPanel buildings={buildings} systemStats={systemStats} />
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
        systemAlerts={(systemStats || defaultStats).systemAlerts}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <SuperAdminHeader
          title={tabTitles[activeTab]}
          systemAlerts={(systemStats || defaultStats).systemAlerts}
        />
        <main className="flex-1 overflow-auto p-6">{renderContent()}</main>
      </div>
    </div>
  )
}
