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
  const [notifications, setNotifications] = useState<any[]>([])
  const [marketplace, setMarketplace] = useState<any[]>([])
  const [tenants, setTenants] = useState<any[]>([])
  const [rentals, setRentals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch data from API
  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      try {
        const buildingId = user?.buildingId
        if (!buildingId) { if (!cancelled) setLoading(false); return }

        const [commRes, marketRes, tenantsRes, rentalsRes] = await Promise.all([
          fetch(`/api/communications?buildingId=${buildingId}`),
          fetch(`/api/marketplace?buildingId=${buildingId}`),
          fetch(`/api/tenants?buildingId=${buildingId}`),
          fetch(`/api/rentals?buildingId=${buildingId}`),
        ])

        if (!cancelled && commRes.ok) {
          const data = await commRes.json()
          setNotifications(data.communications || [])
        }
        if (!cancelled && marketRes.ok) {
          const data = await marketRes.json()
          setMarketplace(data.products || [])
        }
        if (!cancelled && tenantsRes.ok) {
          const data = await tenantsRes.json()
          setTenants(data.tenants || [])
        }
        if (!cancelled && rentalsRes.ok) {
          const data = await rentalsRes.json()
          setRentals(data.listings || [])
        }
      } catch (error) {
        console.error('Error fetching usuario data:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (user) fetchData()
    return () => { cancelled = true }
  }, [user])

  const residentData = {
    name: user?.name || 'Residente',
    unit: '301',
    balance: -25000,
    pendingRequests: 1,
    activeReservations: 2,
    notifications: notifications.length,
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'F1') { e.preventDefault(); setActiveTab('parking') }
    else if (e.key === 'F2') { e.preventDefault(); setActiveTab('payments') }
    else if (e.key === 'F3') { e.preventDefault(); setActiveTab('notifications') }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

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
        return (
          <UsuarioOverview
            residentName={residentData.name}
            unit={residentData.unit}
            balance={residentData.balance}
            pendingRequests={residentData.pendingRequests}
            activeReservations={residentData.activeReservations}
            notifications={residentData.notifications}
            onTabChange={setActiveTab}
            communications={notifications}
          />
        )
      case 'parking':
        return <ParkingRequests />
      case 'marketplace':
        return <Marketplace products={marketplace} />
      case 'alquiler':
        return <AlquilerPanel tenants={tenants} listings={rentals} />
      case 'payments':
        return <UsuarioPayments />
      case 'reservations':
        return <UsuarioReservations />
      case 'notifications':
        return <UsuarioNotifications communications={notifications} />
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
