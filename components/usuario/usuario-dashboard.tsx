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
import { useAnalyticsTrack } from '@/lib/hooks/useAnalytics'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, LayoutDashboard, Car, ShoppingBag, KeyRound, Receipt, Calendar, Bell, Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

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

const menuItems = [
  { id: 'overview', label: 'Inicio', icon: LayoutDashboard },
  { id: 'parking', label: 'Parqueadero Visitas', icon: Car },
  { id: 'marketplace', label: 'Mercado Vecinal', icon: ShoppingBag },
  { id: 'alquiler', label: 'Alquiler e Inquilinos', icon: KeyRound },
  { id: 'payments', label: 'Pagos', icon: Receipt },
  { id: 'reservations', label: 'Reservas', icon: Calendar },
  { id: 'notifications', label: 'Notificaciones', icon: Bell },
  { id: 'settings', label: 'Mi Cuenta', icon: Settings },
]

function MobileNav({ activeTab, onTabChange, unreadNotifications }: { activeTab: string; onTabChange: (tab: string) => void; unreadNotifications: number }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border bg-card px-2 py-2 md:hidden">
      {menuItems.slice(0, 5).map((item) => {
        const Icon = item.icon
        const isActive = activeTab === item.id
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-xs',
              isActive ? 'text-warning' : 'text-muted-foreground'
            )}
          >
            <div className="relative">
              <Icon className="h-5 w-5" />
              {item.id === 'notifications' && unreadNotifications > 0 && (
                <Badge variant="destructive" className="absolute -right-2 -top-1 h-4 w-4 p-0 text-[10px]">
                  {unreadNotifications}
                </Badge>
              )}
            </div>
            <span className="hidden xs:inline">{item.label.split(' ')[0]}</span>
          </button>
        )
      })}
    </div>
  )
}

function MobileHeader({ title, onMenuClick, unreadNotifications }: { title: string; onMenuClick: () => void; unreadNotifications: number }) {
  const { user, logout } = useAuth()
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="h-8 w-8">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-foreground">ResGuard</span>
          <span className="text-[10px] text-muted-foreground">{title}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="h-4 w-4" />
          {unreadNotifications > 0 && (
            <Badge variant="destructive" className="absolute -right-1 -top-1 h-4 w-4 p-0 text-[10px]">
              {unreadNotifications}
            </Badge>
          )}
        </Button>
        <Button variant="ghost" size="icon" onClick={logout} className="h-8 w-8">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}

export function UsuarioDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [notifications, setNotifications] = useState<any[]>([])
  const [marketplace, setMarketplace] = useState<any[]>([])
  const [tenants, setTenants] = useState<any[]>([])
  const [rentals, setRentals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useAnalyticsTrack(activeTab, 'usuario')

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
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <UsuarioSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          unreadNotifications={residentData.notifications}
          unit={residentData.unit}
        />
      </div>

      {/* Mobile Sheet Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <UsuarioSidebar
            activeTab={activeTab}
            onTabChange={(tab) => { setActiveTab(tab); setSidebarOpen(false) }}
            unreadNotifications={residentData.notifications}
            unit={residentData.unit}
          />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <MobileHeader 
          title={tabTitles[activeTab]} 
          onMenuClick={() => setSidebarOpen(true)}
          unreadNotifications={residentData.notifications}
        />

        {/* Desktop Header */}
        <div className="hidden md:block">
          <UsuarioHeader
            title={tabTitles[activeTab]}
            unreadNotifications={residentData.notifications}
          />
        </div>

        <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">{renderContent()}</main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        unreadNotifications={residentData.notifications}
      />
    </div>
  )
}
