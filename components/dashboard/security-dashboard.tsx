'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useAnalyticsTrack } from '@/lib/hooks/useAnalytics'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { Overview } from './overview'
import { ParkingMap } from './parking-map'
import { VisitorList } from './visitor-list'
import { AlertsPanel } from './alerts-panel'
import { ReportsPanel } from './reports-panel'
import { NewEntryDialog } from './new-entry-dialog'
import { InquilinosPanel } from './inquilinos-panel'
import type { ParkingSpot, Visitor, Alert } from '@/lib/types'

const tabTitles: Record<string, string> = {
  overview: 'Dashboard de Turno',
  parking: 'Mapa de Parqueaderos',
  visitors: 'Registro de Visitantes',
  inquilinos: 'Inquilinos y Vehiculos Autorizados',
  alerts: 'Alertas y Notificaciones',
  reports: 'Reportes de Turno',
}

export function SecurityDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [newEntryOpen, setNewEntryOpen] = useState(false)
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([])
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [tenants, setTenants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useAnalyticsTrack(activeTab, 'security')

  // Fetch data from API
  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      try {
        const buildingId = user?.buildingId
        if (!buildingId) { if (!cancelled) setLoading(false); return }

        const [parkingRes, visitorsRes, alertsRes, tenantsRes] = await Promise.all([
          fetch(`/api/parking?buildingId=${buildingId}`),
          fetch(`/api/visitors?buildingId=${buildingId}`),
          fetch(`/api/alerts?buildingId=${buildingId}`),
          fetch(`/api/tenants?buildingId=${buildingId}`),
        ])

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

        if (!cancelled && visitorsRes.ok) {
          const data = await visitorsRes.json()
          setVisitors((data.visitors || []).map((v: any) => ({
            id: v.id,
            name: v.name,
            documentId: v.document_id,
            type: v.type,
            vehiclePlate: v.vehicle_plate,
            destinationUnit: v.destination_unit,
            residentName: v.resident_name,
            entryTime: new Date(v.entry_time),
            exitTime: v.exit_time ? new Date(v.exit_time) : undefined,
            parkingSpot: v.parking_spot,
            status: v.status,
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
        if (!cancelled && tenantsRes.ok) {
          const data = await tenantsRes.json()
          setTenants(data.tenants || [])
        }
      } catch (error) {
        console.error('Error fetching security data:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (user) fetchData()
    return () => { cancelled = true }
  }, [user])

  const unreadAlerts = alerts.filter((a) => !a.read).length

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'F1') { e.preventDefault(); setNewEntryOpen(true) }
    else if (e.key === 'F2') { e.preventDefault(); setActiveTab('visitors') }
    else if (e.key === 'F3') { e.preventDefault(); setActiveTab('alerts') }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    const timer = setInterval(() => {
      setParkingSpots((spots) =>
        spots.map((spot) => {
          if ((spot.status === 'occupied' || spot.status === 'overtime') && spot.timeRemaining !== undefined) {
            const newTime = spot.timeRemaining - 1
            return { ...spot, timeRemaining: newTime, status: newTime < 0 ? 'overtime' : 'occupied' }
          }
          return spot
        })
      )
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const handleSpotUpdate = (spotId: string, updates: Partial<ParkingSpot>) => {
    setParkingSpots((spots) =>
      spots.map((spot) => (spot.id === spotId ? { ...spot, ...updates } : spot))
    )
  }

  const handleVisitorExit = (visitorId: string) => {
    setVisitors((visitors) =>
      visitors.map((v) =>
        v.id === visitorId ? { ...v, status: 'exited', exitTime: new Date() } : v
      )
    )
    const visitor = visitors.find((v) => v.id === visitorId)
    if (visitor?.parkingSpot) {
      const spot = parkingSpots.find((s) => s.code === visitor.parkingSpot)
      if (spot) {
        handleSpotUpdate(spot.id, {
          status: 'available',
          vehiclePlate: undefined,
          visitorName: undefined,
          residentUnit: undefined,
          entryTime: undefined,
          timeRemaining: undefined,
        })
      }
    }
  }

  const handleMarkAlertRead = (alertId: string) => {
    setAlerts((alerts) => alerts.map((a) => (a.id === alertId ? { ...a, read: true } : a)))
  }

  const handleMarkAllAlertsRead = () => {
    setAlerts((alerts) => alerts.map((a) => ({ ...a, read: true })))
  }

  const handleDismissAlert = (alertId: string) => {
    setAlerts((alerts) => alerts.filter((a) => a.id !== alertId))
  }

  const handleNewEntry = (visitorData: Omit<Visitor, 'id' | 'entryTime' | 'status'>) => {
    const newVisitor: Visitor = {
      ...visitorData,
      id: Date.now().toString(),
      entryTime: new Date(),
      status: 'inside',
    }
    setVisitors((v) => [newVisitor, ...v])
    if (visitorData.type === 'vehicle' && visitorData.parkingSpot) {
      const spot = parkingSpots.find((s) => s.code === visitorData.parkingSpot)
      if (spot) {
        handleSpotUpdate(spot.id, {
          status: 'occupied',
          vehiclePlate: visitorData.vehiclePlate,
          visitorName: visitorData.name,
          residentUnit: visitorData.destinationUnit,
          entryTime: new Date(),
          timeRemaining: 120,
        })
      }
    }
    const newAlert: Alert = {
      id: Date.now().toString(),
      type: 'visitor_entry',
      title: 'New Visitor Entry',
      message: `${visitorData.name} (${visitorData.type}) has entered to visit unit ${visitorData.destinationUnit}.`,
      timestamp: new Date(),
      read: false,
      priority: 'low',
      relatedId: newVisitor.id,
    }
    setAlerts((a) => [newAlert, ...a])
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando datos...</p>
      </div>
    )
  }

  const availableSpots = parkingSpots.filter((s) => s.status === 'available')

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <Overview
            parkingSpots={parkingSpots}
            visitors={visitors}
            alerts={alerts}
            onSpotUpdate={handleSpotUpdate}
            onMarkAlertRead={handleMarkAlertRead}
            onMarkAllAlertsRead={handleMarkAllAlertsRead}
            onDismissAlert={handleDismissAlert}
          />
        )
      case 'parking':
        return <ParkingMap parkingSpots={parkingSpots} onSpotUpdate={handleSpotUpdate} />
      case 'visitors':
        return <VisitorList visitors={visitors} onVisitorExit={handleVisitorExit} />
      case 'inquilinos':
        return <InquilinosPanel tenants={tenants} />
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
      default:
        return null
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unreadAlerts={unreadAlerts}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          title={tabTitles[activeTab]}
          onNewEntry={() => setNewEntryOpen(true)}
          unreadAlerts={unreadAlerts}
        />
        <main className="flex-1 overflow-auto p-6">{renderContent()}</main>
      </div>

      <NewEntryDialog
        open={newEntryOpen}
        onOpenChange={setNewEntryOpen}
        availableSpots={availableSpots}
        onSubmit={handleNewEntry}
      />
    </div>
  )
}
