'use client'

import { useState, useEffect, useCallback } from 'react'
import { UsuarioSidebar } from './usuario-sidebar'
import { UsuarioHeader } from './usuario-header'
import { UsuarioOverview } from './usuario-overview'
import { ParkingRequests } from './parking-requests'
import { UsuarioPayments } from './usuario-payments'
import { UsuarioReservations } from './usuario-reservations'
import { UsuarioNotifications } from './usuario-notifications'
import { UsuarioSettings } from './usuario-settings'
import { Marketplace } from './marketplace'
import { AlquilerPanel } from './alquiler-panel'
import { useAuth } from '@/lib/auth-context'

const tabTitles: Record<string, string> = {
  overview: 'Inicio',
  parking: 'Parqueadero de Visitantes',
  marketplace: 'Mercado Vecinal - Emprendedores',
  alquiler: 'Alquiler e Inquilinos',
  payments: 'Pagos y Estado de Cuenta',
  reservations: 'Reservas de Areas Comunes',
  notifications: 'Notificaciones del Edificio',
  settings: 'Mi Cuenta',
}

export function UsuarioDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')

  // Mock data for resident
  const residentData = {
    name: user?.name || 'Residente',
    unit: '301',
    balance: -25000,
    pendingRequests: 1,
    activeReservations: 2,
    notifications: 2,
  }

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'F1') {
      e.preventDefault()
      setActiveTab('parking')
    } else if (e.key === 'F2') {
      e.preventDefault()
      setActiveTab('payments')
    } else if (e.key === 'F3') {
      e.preventDefault()
      setActiveTab('notifications')
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
          <UsuarioOverview
            residentName={residentData.name}
            unit={residentData.unit}
            balance={residentData.balance}
            pendingRequests={residentData.pendingRequests}
            activeReservations={residentData.activeReservations}
            notifications={residentData.notifications}
            onTabChange={setActiveTab}
          />
        )
      case 'parking':
        return <ParkingRequests />
      case 'marketplace':
        return <Marketplace />
      case 'alquiler':
        return <AlquilerPanel />
      case 'payments':
        return <UsuarioPayments />
      case 'reservations':
        return <UsuarioReservations />
      case 'notifications':
        return <UsuarioNotifications />
      case 'settings':
        return <UsuarioSettings />
      default:
        return null
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <UsuarioSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unreadNotifications={residentData.notifications}
        unit={residentData.unit}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <UsuarioHeader
          title={tabTitles[activeTab]}
          unreadNotifications={residentData.notifications}
        />
        <main className="flex-1 overflow-auto p-6">{renderContent()}</main>
      </div>
    </div>
  )
}
