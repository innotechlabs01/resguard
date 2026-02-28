'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { Overview } from './overview'
import { ParkingMap } from './parking-map'
import { VisitorList } from './visitor-list'
import { AlertsPanel } from './alerts-panel'
import { AIConcierge } from './ai-concierge'
import { ReportsPanel } from './reports-panel'
import { NewEntryDialog } from './new-entry-dialog'
import { InquilinosPanel } from './inquilinos-panel'
import {
  mockParkingSpots,
  mockVisitors,
  mockAlerts,
} from '@/lib/mock-data'
import type { ParkingSpot, Visitor, Alert } from '@/lib/types'

const tabTitles: Record<string, string> = {
  overview: 'Dashboard de Turno',
  parking: 'Mapa de Parqueaderos',
  visitors: 'Registro de Visitantes',
  inquilinos: 'Inquilinos y Vehiculos Autorizados',
  alerts: 'Alertas y Notificaciones',
  concierge: 'Asistente Virtual',
  reports: 'Reportes de Turno',
}

export function SecurityDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [newEntryOpen, setNewEntryOpen] = useState(false)
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>(mockParkingSpots)
  const [visitors, setVisitors] = useState<Visitor[]>(mockVisitors)
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts)

  const unreadAlerts = alerts.filter((a) => !a.read).length

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'F1') {
      e.preventDefault()
      setNewEntryOpen(true)
    } else if (e.key === 'F2') {
      e.preventDefault()
      setActiveTab('visitors')
    } else if (e.key === 'F3') {
      e.preventDefault()
      setActiveTab('alerts')
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Parking spot timer simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setParkingSpots((spots) =>
        spots.map((spot) => {
          if (
            (spot.status === 'occupied' || spot.status === 'overtime') &&
            spot.timeRemaining !== undefined
          ) {
            const newTime = spot.timeRemaining - 1
            return {
              ...spot,
              timeRemaining: newTime,
              status: newTime < 0 ? 'overtime' : 'occupied',
            }
          }
          return spot
        })
      )
    }, 60000) // Update every minute

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
    // Also release the parking spot if they had one
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

  const handleNewEntry = (visitorData: Omit<Visitor, 'id' | 'entryTime' | 'status'>) => {
    const newVisitor: Visitor = {
      ...visitorData,
      id: Date.now().toString(),
      entryTime: new Date(),
      status: 'inside',
    }
    setVisitors((v) => [newVisitor, ...v])

    // Update parking spot if vehicle
    if (visitorData.type === 'vehicle' && visitorData.parkingSpot) {
      const spot = parkingSpots.find((s) => s.code === visitorData.parkingSpot)
      if (spot) {
        handleSpotUpdate(spot.id, {
          status: 'occupied',
          vehiclePlate: visitorData.vehiclePlate,
          visitorName: visitorData.name,
          residentUnit: visitorData.destinationUnit,
          entryTime: new Date(),
          timeRemaining: 120, // 2 hours
        })
      }
    }

    // Add entry alert
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
        return <InquilinosPanel />
      case 'alerts':
        return (
          <AlertsPanel
            alerts={alerts}
            onMarkAsRead={handleMarkAlertRead}
            onMarkAllRead={handleMarkAllAlertsRead}
            onDismiss={handleDismissAlert}
          />
        )
      case 'concierge':
        return <AIConcierge />
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
