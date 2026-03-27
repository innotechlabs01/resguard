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
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [building, setBuilding] = useState<BuildingStats | null>(null)
  const [residents, setResidents] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [communications, setCommunications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch data from API
  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      try {
        const buildingId = user?.buildingId
        if (!buildingId) {
          if (!cancelled) setLoading(false)
          return
        }

        const [buildingsRes, parkingRes, alertsRes, residentsRes, paymentsRes, commRes] = await Promise.all([
          fetch('/api/buildings'),
          fetch(`/api/parking?buildingId=${buildingId}`),
          fetch(`/api/alerts?buildingId=${buildingId}`),
          fetch(`/api/residents?buildingId=${buildingId}`),
          fetch(`/api/payments?buildingId=${buildingId}`),
          fetch(`/api/communications?buildingId=${buildingId}`),
        ])

        if (!cancelled && buildingsRes.ok) {
          const data = await buildingsRes.json()
          const found = (data.buildings || []).find((b: any) => b.id === buildingId)
          if (found) {
            setBuilding({
              id: found.id,
              name: found.name,
              address: found.address,
              totalUnits: found.total_units,
              occupiedUnits: 0,
              totalParkingSpots: found.total_parking_spots,
              visitorParkingSpots: found.visitor_parking_spots,
              monthlyRevenue: found.monthly_fee || 0,
              outstandingBalance: found.outstanding_balance || 0,
              lastPaymentDate: found.last_payment_date ? new Date(found.last_payment_date) : undefined,
              subscriptionStatus: found.subscription_status || 'active',
              activeVisitors: 0,
              pendingAlerts: 0,
              status: 'active' as const,
            })
          }
        }

        if (!cancelled && parkingRes.ok) {
          const data = await parkingRes.json()
          setParkingSpots((data.spots || []).map((s: any) => ({
            id: s.id,
            code: s.code,
            status: s.status,
            vehiclePlate: s.vehicle_plate,
            visitorName: s.visitor_name,
            residentUnit: s.resident_unit,
            entryTime: s.entry_time ? new Date(s.entry_time) : undefined,
            maxDuration: s.max_duration || 120,
          })))
        }

        if (!cancelled && alertsRes.ok) {
          const data = await alertsRes.json()
          setAlerts((data.alerts || []).map((a: any) => ({
            id: a.id,
            type: a.type,
            title: a.title,
            message: a.message,
            timestamp: new Date(a.timestamp),
            read: Boolean(a.read),
            priority: a.priority,
            relatedId: a.related_id,
            actionRequired: Boolean(a.action_required),
          })))
        }

        if (!cancelled && residentsRes.ok) {
          const data = await residentsRes.json()
          setResidents(data.residents || [])
        }

        if (!cancelled && paymentsRes.ok) {
          const data = await paymentsRes.json()
          setPayments(data.payments || [])
        }

        if (!cancelled && commRes.ok) {
          const data = await commRes.json()
          setCommunications(data.communications || [])
        }
      } catch (error) {
        console.error('Error fetching admin data:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (user) fetchData()
    return () => { cancelled = true }
  }, [user])

  const unreadAlerts = alerts.filter((a) => !a.read).length

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'F1') { e.preventDefault(); setActiveTab('residents') }
    else if (e.key === 'F2') { e.preventDefault(); setActiveTab('payments') }
    else if (e.key === 'F3') { e.preventDefault(); setActiveTab('alerts') }
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando datos...</p>
      </div>
    )
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
        return <ResidentsPanel residents={residents} />
      case 'parking':
        return <ParkingManagementPanel residents={residents} parkingSpots={parkingSpots} />
      case 'visitorParking':
        return <ParkingMap parkingSpots={parkingSpots} onSpotUpdate={handleSpotUpdate} />
      case 'payments':
        return <PaymentsPanel payments={payments} />
      case 'comunicaciones':
        return <ComunicacionesPanel communications={communications} />
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
