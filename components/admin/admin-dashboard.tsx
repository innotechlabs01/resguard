'use client'

import { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import { AdminSidebar } from './admin-sidebar'
import { AdminHeader } from './admin-header'
import { AdminOverview } from './admin-overview'
import { ResidentsPanel } from './residents-panel'
import { PaymentsPanel } from './payments-panel'
import { AdminSettingsPanel } from './admin-settings-panel'
import { ComunicacionesPanel } from './comunicaciones-panel'
import { ParkingManagementPanel } from './parking-management-panel'
import type { ParkingSpot, Alert, BuildingStats } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'
import { useAnalyticsTrack } from '@/lib/hooks/useAnalytics'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Menu, LayoutDashboard, Users, Car, CreditCard, FileText, Settings, Bell, LogOut, Building2, Send, CarFront, CalendarDays, Building, Bot, Ticket, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { SkeletonCard } from '@/components/ui/skeleton-loaders'
import { AssemblyPanel } from './assembly-panel'
import { AIConcierge } from '../dashboard/ai-concierge'
import { PqrsPanel } from '../dashboard/pqrs-panel'
import { ChatPanel } from '../dashboard/chat-panel'

const ParkingMap = lazy(() => import('@/components/dashboard/parking-map').then(m => ({ default: m.ParkingMap })))
const AlertsPanel = lazy(() => import('@/components/dashboard/alerts-panel').then(m => ({ default: m.AlertsPanel })))
const ReportsPanel = lazy(() => import('@/components/dashboard/reports-panel').then(m => ({ default: m.ReportsPanel })))

const tabTitles: Record<string, string> = {
  overview: 'Dashboard del Edificio',
  residents: 'Gestion de Residentes',
  parking: 'Parqueaderos Residentes',
  visitorParking: 'Parqueadero Visitantes',
  payments: 'Pagos y Cobros',
  comunicaciones: 'Comunicaciones',
  assemblies: 'Asambleas',
  pqrs: 'PQRS',
  chat: 'Mensajes',
  alerts: 'Alertas',
  reports: 'Reportes',
  settings: 'Configuracion',
}

const navItems = [
  { id: 'overview', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'residents', icon: Users, label: 'Residentes' },
  { id: 'parking', icon: Car, label: 'Parqueaderos' },
  { id: 'visitorParking', icon: CarFront, label: 'Visitantes' },
  { id: 'payments', icon: CreditCard, label: 'Pagos' },
  { id: 'comunicaciones', icon: Send, label: 'Comunicaciones' },
  { id: 'assemblies', icon: CalendarDays, label: 'Asambleas' },
  { id: 'pqrs', icon: Ticket, label: 'PQRS' },
  { id: 'chat', icon: MessageSquare, label: 'Mensajes' },
  { id: 'alerts', icon: Bell, label: 'Alertas', badge: true },
  { id: 'reports', icon: FileText, label: 'Reportes' },
  { id: 'concierge', icon: Bot, label: 'Concierge' },
  { id: 'settings', icon: Settings, label: 'Configuracion' },
]

function MobileNav({ activeTab, onTabChange, unreadAlerts }: { activeTab: string; onTabChange: (tab: string) => void; unreadAlerts: number }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between border-t border-border bg-card px-1 py-1.5 md:hidden overflow-x-auto">
      <nav className="flex w-full justify-between gap-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 rounded-md px-1 py-1 text-[10px] min-w-0 transition-colors',
                isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground'
              )}
            >
              <div className="relative">
                <Icon className="h-4 w-4" />
                {item.badge && unreadAlerts > 0 && (
                  <Badge variant="destructive" className="absolute -right-1.5 -top-1 h-3.5 w-3.5 p-0 text-[8px]">
                    {unreadAlerts > 9 ? '9+' : unreadAlerts}
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

function MobileHeader({ title, onMenuClick, unreadAlerts }: { title: string; onMenuClick: () => void; unreadAlerts: number }) {
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
          {unreadAlerts > 0 && (
            <Badge variant="destructive" className="absolute -right-0.5 -top-0.5 h-4 w-4 p-0 text-[10px]">
              {unreadAlerts > 9 ? '9+' : unreadAlerts}
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

export function AdminDashboard() {
  const { user, isAuthenticated, isDemoMode, isLoaded } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [building, setBuilding] = useState<BuildingStats | null>(null)
  const [residents, setResidents] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [communications, setCommunications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useAnalyticsTrack(activeTab, 'admin')

  // Show empty state if not logged in
  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <SkeletonCard className="h-64 w-64" />
      </div>
    )
  }

  if (isDemoMode || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Card className="max-w-md mx-4 bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Building className="h-6 w-6" />
              Modo Demo
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Inicia sesión con Clerk para ver los datos de tu edificio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Currently showing demo data. Please sign in with Clerk to access real building data.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isAuthenticated && !user.buildingId) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Card className="max-w-md mx-4 bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Building2 className="h-6 w-6" />
              Edificio no asignado
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Tu cuenta no tiene un edificio asignado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Contacta al administrador del sistema para que asigne tu usuario a un edificio.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

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

        const fetchOptions = { 
          next: { revalidate: 30, tags: [`building-${buildingId}`, 'buildings'] }
        }

        const [buildingsRes, parkingRes, alertsRes, residentsRes, paymentsRes, commRes] = await Promise.all([
          fetch('/api/buildings', fetchOptions),
          fetch(`/api/parking?buildingId=${buildingId}`, fetchOptions),
          fetch(`/api/alerts?buildingId=${buildingId}`, fetchOptions),
          fetch(`/api/residents?buildingId=${buildingId}`, fetchOptions),
          fetch(`/api/payments?buildingId=${buildingId}`, fetchOptions),
          fetch(`/api/communications?buildingId=${buildingId}`, fetchOptions),
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
        return (
          <Suspense fallback={<SkeletonCard className="h-[400px]" />}>
            <ParkingMap parkingSpots={parkingSpots} onSpotUpdate={handleSpotUpdate} />
          </Suspense>
        )
      case 'payments':
        return <PaymentsPanel payments={payments} />
      case 'comunicaciones':
        return <ComunicacionesPanel communications={communications} />
      case 'assemblies':
        return <AssemblyPanel />
      case 'pqrs':
        return <PqrsPanel buildingId={building?.id || ''} />
      case 'chat':
        return <ChatPanel buildingId={building?.id || ''} />
      case 'alerts':
        return (
          <Suspense fallback={<SkeletonCard className="h-[200px]" />}>
            <AlertsPanel
              alerts={alerts}
              onMarkAsRead={handleMarkAlertRead}
              onMarkAllRead={handleMarkAllAlertsRead}
              onDismiss={handleDismissAlert}
            />
          </Suspense>
        )
      case 'reports':
        return (
          <Suspense fallback={<SkeletonCard className="h-[400px]" />}>
            <ReportsPanel />
          </Suspense>
        )
      case 'concierge':
        return <AIConcierge />
      case 'settings':
        return building ? <AdminSettingsPanel building={building} /> : null
      default:
        return null
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <AdminSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          unreadAlerts={unreadAlerts}
          buildingName={building?.name || 'Cargando...'}
        />
      </div>

      {/* Mobile Sheet Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <AdminSidebar
            activeTab={activeTab}
            onTabChange={(tab) => { setActiveTab(tab); setSidebarOpen(false) }}
            unreadAlerts={unreadAlerts}
            buildingName={building?.name || 'Cargando...'}
          />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <MobileHeader 
          title={tabTitles[activeTab]} 
          onMenuClick={() => setSidebarOpen(true)}
          unreadAlerts={unreadAlerts}
        />

        {/* Desktop Header */}
        <div className="hidden md:block">
          <AdminHeader
            title={tabTitles[activeTab]}
            unreadAlerts={unreadAlerts}
            buildingName={building?.name || ''}
          />
        </div>

        <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">{renderContent()}</main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        unreadAlerts={unreadAlerts}
      />
    </div>
  )
}
