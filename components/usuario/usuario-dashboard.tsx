'use client'

import { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import { UsuarioSidebar } from './usuario-sidebar'
import { UsuarioHeader } from './usuario-header'
import { UsuarioOverview } from './usuario-overview'
import { ParkingRequests } from './parking-requests'
import { UsuarioPayments } from './usuario-payments'
import { UsuarioReservations } from './usuario-reservations'
import { UsuarioNotifications } from './usuario-notifications'
import { UsuarioSettings } from './usuario-settings'
import { AlquilerPanel } from './alquiler-panel'
import { useAuth } from '@/lib/auth-context'
import { useAnalyticsTrack } from '@/lib/hooks/useAnalytics'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Menu, LayoutDashboard, Car, ShoppingBag, KeyRound, Receipt, Calendar, Bell, Settings, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { SkeletonCard } from '@/components/ui/skeleton-loaders'

const Marketplace = lazy(() => import('@/components/usuario/marketplace').then(m => ({ default: m.Marketplace })))

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
    <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between border-t border-border bg-card px-1 py-1.5 md:hidden overflow-x-auto">
      <nav className="flex w-full justify-between gap-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 rounded-md px-1 py-1 text-[10px] min-w-0 transition-colors',
                isActive ? 'text-warning bg-warning/10' : 'text-muted-foreground'
              )}
            >
              <div className="relative">
                <Icon className="h-4 w-4" />
                {item.id === 'notifications' && unreadNotifications > 0 && (
                  <Badge variant="destructive" className="absolute -right-1.5 -top-1 h-3.5 w-3.5 p-0 text-[8px]">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </Badge>
                )}
              </div>
              <span className="truncate w-full text-center">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

function MobileHeader({ title, onMenuClick, unreadNotifications }: { title: string; onMenuClick: () => void; unreadNotifications: number }) {
  const { user, logout } = useAuth()
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-3 md:hidden">
      <div className="flex items-center gap-2 min-w-0">
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="h-8 w-8 flex-shrink-0">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-semibold text-foreground">ResGuard</span>
          <span className="text-[10px] text-muted-foreground truncate max-w-[120px]" title={title}>{title}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="h-4 w-4" />
          {unreadNotifications > 0 && (
            <Badge variant="destructive" className="absolute -right-0.5 -top-0.5 h-4 w-4 p-0 text-[10px]">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
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
  const { user, isAuthenticated, isDemoMode, isLoaded } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [notifications, setNotifications] = useState<any[]>([])
  const [marketplace, setMarketplace] = useState<any[]>([])
  const [tenants, setTenants] = useState<any[]>([])
  const [rentals, setRentals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useAnalyticsTrack(activeTab, 'usuario')

  // Show loading state
  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <SkeletonCard className="h-64 w-64" />
      </div>
    )
  }

  // Show empty state for demo mode
  if (isDemoMode || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Card className="max-w-md mx-4 bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <User className="h-6 w-6" />
              Modo Demo
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Inicia sesión para acceder a tu cuenta de residente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Este panel solo está disponible para usuarios autenticados con Clerk.
            </p>
            <p className="text-sm text-muted-foreground">
              Contacta al administrador si necesitas acceso.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fetch data from API only when authenticated
  useEffect(() => {
    if (!isAuthenticated) return
    
    let cancelled = false
    async function fetchData() {
      try {
        const buildingId = user?.buildingId
        if (!buildingId) { if (!cancelled) setLoading(false); return }

        const fetchOptions = { 
          next: { revalidate: 30, tags: [`building-${buildingId}`, 'communications', 'marketplace', 'tenants'] }
        }

        const [commRes, marketRes, tenantsRes, rentalsRes] = await Promise.all([
          fetch(`/api/communications?buildingId=${buildingId}`, fetchOptions),
          fetch(`/api/marketplace?buildingId=${buildingId}`, fetchOptions),
          fetch(`/api/tenants?buildingId=${buildingId}`, fetchOptions),
          fetch(`/api/rentals?buildingId=${buildingId}`, fetchOptions),
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
    fetchData()
    return () => { cancelled = true }
  }, [user, isAuthenticated])

  const residentData = {
    name: user?.name || 'Residente',
    unit: user?.buildingId ? 'N/A' : '-',
    balance: 0,
    pendingRequests: 0,
    activeReservations: 0,
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
        return (
          <Suspense fallback={<SkeletonCard className="h-[300px]" />}>
            <Marketplace products={marketplace} />
          </Suspense>
        )
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
