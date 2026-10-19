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
import { ParkingOwnershipPanel } from '../dashboard/parking-ownership-panel'
import type { ParkingSpot, Alert, BuildingStats } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'
import { useAnalyticsTrack } from '@/lib/hooks/useAnalytics'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Menu, LayoutDashboard, Users, CreditCard, Bell, LogOut, Building2, Building, Inbox } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { SkeletonCard } from '@/components/ui/skeleton-loaders'
import { AssemblyPanel } from './assembly-panel'
import { AIConcierge } from '../dashboard/ai-concierge'
import { PqrsPanel } from '../dashboard/pqrs-panel'
import { ConvivenciaPanel } from '../dashboard/convivencia-panel'
import { HelpdeskInboxPanel } from './helpdesk-inbox-panel'
import { ChatPanel } from '../dashboard/chat-panel'
import { MaintenancePanel } from '../dashboard/maintenance-panel'
import { UtilityPanel } from '../dashboard/utility-panel'
import { ProvidersPanel } from '../dashboard/providers-panel'
import { SurveysPanel } from '../dashboard/surveys-panel'
import { OnboardingPanel } from '../dashboard/onboarding-panel'

const ParkingMap = lazy(() => import('@/components/dashboard/parking-map').then(m => ({ default: m.ParkingMap })))
const AlertsPanel = lazy(() => import('@/components/dashboard/alerts-panel').then(m => ({ default: m.AlertsPanel })))
const ReportsPanel = lazy(() => import('@/components/dashboard/reports-panel').then(m => ({ default: m.ReportsPanel })))

const tabTitles: Record<string, string> = {
  overview: 'Dashboard del Edificio',
  inbox: 'Inbox',
  residents: 'Gestión de Residentes',
  parking: 'Parqueaderos Residentes',
  visitorParking: 'Parqueadero Visitantes',
  parkingOwnership: 'Parqueaderos Asignados',
  payments: 'Pagos y Cobros',
  comunicaciones: 'Comunicaciones',
  assemblies: 'Asambleas',
  pqrs: 'PQRS',
  convivencia: 'Convivencia',
  maintenance: 'Mantenimiento',
  utilities: 'Consumo de Servicios',
  providers: 'Proveedores',
  chat: 'Mensajes',
  alerts: 'Alertas',
  reports: 'Reportes',
  settings: 'Configuración',
  surveys: 'Encuestas',
  onboarding: 'Onboarding',
  concierge: 'Concierge',
}

/**
 * Primary destinations for the small-screen bottom bar. Secondary modules
 * remain reachable from the sheet sidebar (hamburger), so no route is removed.
 */
const mobileNavItems: { id: string; icon: LucideIcon; label: string; badge?: boolean }[] = [
  { id: 'overview', icon: LayoutDashboard, label: 'Inicio' },
  { id: 'residents', icon: Users, label: 'Residentes' },
  { id: 'payments', icon: CreditCard, label: 'Pagos' },
  { id: 'alerts', icon: Bell, label: 'Alertas', badge: true },
  { id: 'inbox', icon: Inbox, label: 'Inbox' },
]

function MobileNav({ activeTab, onTabChange, unreadAlerts }: { activeTab: string; onTabChange: (tab: string) => void; unreadAlerts: number }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border bg-card px-1 pb-[env(safe-area-inset-bottom)] pt-1.5 md:hidden">
      {mobileNavItems.map((item) => {
        const Icon = item.icon
        const isActive = activeTab === item.id
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 rounded-md px-1 py-1 text-[10px] min-w-0 transition-colors',
              isActive ? 'text-brand' : 'text-muted-foreground',
            )}
          >
            <div className="relative">
              <Icon className="h-5 w-5" />
              {item.badge && unreadAlerts > 0 && (
                <Badge variant="destructive" className="absolute -right-2 -top-1.5 h-3.5 w-3.5 justify-center p-0 text-[8px]">
                  {unreadAlerts > 9 ? '9+' : unreadAlerts}
                </Badge>
              )}
            </div>
            <span className="w-full truncate text-center">{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function MobileHeader({ title, onMenuClick, unreadAlerts }: { title: string; onMenuClick: () => void; unreadAlerts: number }) {
  const { user, logout } = useAuth()
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-3 md:hidden">
      <div className="flex min-w-0 items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="h-8 w-8 flex-shrink-0" aria-label="Abrir menú">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex min-w-0 flex-col">
          <span className="text-xs font-semibold text-foreground">ResGuard</span>
          <span className="max-w-[140px] truncate text-[10px] text-muted-foreground" title={title}>{title}</span>
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-1">
        <Button variant="ghost" size="icon" className="relative h-8 w-8" aria-label={unreadAlerts > 0 ? `${unreadAlerts} alertas sin leer` : 'Notificaciones'}>
          <Bell className="h-4 w-4" />
          {unreadAlerts > 0 && (
            <Badge variant="destructive" className="absolute -right-0.5 -top-0.5 h-4 w-4 justify-center p-0 text-[10px]">
              {unreadAlerts > 9 ? '9+' : unreadAlerts}
            </Badge>
          )}
        </Button>
        <Button variant="ghost" size="icon" onClick={logout} className="h-8 w-8" aria-label={`Cerrar sesión${user?.name ? ` de ${user.name}` : ''}`}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}

/** Skeleton shown while the building snapshot is loading. */
function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SkeletonCard className="h-8 w-64" />
        <SkeletonCard className="h-4 w-40" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} className="h-36" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} className="h-56" />
        ))}
      </div>
    </div>
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
  const [focusTarget, setFocusTarget] = useState<{ type: 'pqrs' | 'infraction'; id: string } | null>(null)

  useAnalyticsTrack(activeTab, 'admin')

  // Fetch building data from the API (unchanged data source / contract).
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
          // /api/alerts GET returns a bare array (DbAlert: created_at, read 0/1).
          const alertsList = Array.isArray(data) ? data : (data.alerts || [])
          setAlerts(alertsList.map((a: any) => ({
            id: a.id,
            type: a.type,
            title: a.title,
            message: a.message,
            timestamp: new Date(a.timestamp ?? a.created_at),
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

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'F1') { e.preventDefault(); setActiveTab('residents') }
    else if (e.key === 'F2') { e.preventDefault(); setActiveTab('payments') }
    else if (e.key === 'F3') { e.preventDefault(); setActiveTab('alerts') }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const unreadAlerts = alerts.filter((a) => !a.read).length

  // ---- Auth/tenant guards (after all hooks to keep hook order stable) ----
  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <SkeletonCard className="h-64 w-64" />
      </div>
    )
  }

  if (isDemoMode || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Building className="h-6 w-6 text-brand" />
              Sesión requerida
            </CardTitle>
            <CardDescription>
              Inicia sesión para ver los datos de tu edificio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Al autenticarte podrás administrar residentes, pagos, parqueaderos y
              comunicaciones de tu copropiedad.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isAuthenticated && !user.buildingId) {
    return (
      <div className="flex h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Building2 className="h-6 w-6 text-brand" />
              Edificio no asignado
            </CardTitle>
            <CardDescription>Tu cuenta no tiene un edificio asignado.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Contacta al administrador del sistema para que asigne tu usuario a un edificio.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Spot updates persist via PUT /api/parking (protected by requireAuth +
  // assertBuildingAccess on the server); local state only updates after the
  // API confirms. timeRemaining/maxDuration stay local-only (not DB columns).
  const handleSpotUpdate = async (spotId: string, updates: Partial<ParkingSpot>) => {
    try {
      const body: Record<string, unknown> = { id: spotId }
      if (updates.status !== undefined) body.status = updates.status
      if (updates.vehiclePlate !== undefined) body.vehicle_plate = updates.vehiclePlate || null
      if (updates.visitorName !== undefined) body.visitor_name = updates.visitorName || null
      if (updates.residentUnit !== undefined) body.resident_unit = updates.residentUnit || null
      if (updates.entryTime !== undefined) body.entry_time = updates.entryTime ? updates.entryTime.toISOString() : null
      const res = await fetch('/api/parking', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to update parking spot')
      setParkingSpots((spots) =>
        spots.map((spot) => (spot.id === spotId ? { ...spot, ...updates } : spot))
      )
    } catch (error) {
      console.error('Error updating parking spot:', error)
    }
  }

  const handleMarkAlertRead = async (alertId: string) => {
    try {
      const res = await fetch('/api/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: alertId, read: 1 }),
      })
      if (!res.ok) throw new Error('Failed to mark alert as read')
      setAlerts((alerts) =>
        alerts.map((a) => (a.id === alertId ? { ...a, read: true } : a))
      )
    } catch (error) {
      console.error('Error marking alert as read:', error)
    }
  }

  const handleMarkAllAlertsRead = async () => {
    const unread = alerts.filter((a) => !a.read)
    if (unread.length === 0) return
    try {
      const results = await Promise.all(
        unread.map((a) =>
          fetch('/api/alerts', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: a.id, read: 1 }),
          })
        )
      )
      if (!results.every((r) => r.ok)) throw new Error('Failed to mark some alerts as read')
      setAlerts((alerts) => alerts.map((a) => ({ ...a, read: true })))
    } catch (error) {
      console.error('Error marking all alerts as read:', error)
    }
  }

  const handleOpenTicketDetail = useCallback((type: 'pqrs' | 'infraction', id: string) => {
    setFocusTarget({ type, id })
    setActiveTab(type === 'pqrs' ? 'pqrs' : 'convivencia')
  }, [])

  const handleDismissAlert = async (alertId: string) => {
    try {
      const res = await fetch(`/api/alerts?id=${encodeURIComponent(alertId)}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to dismiss alert')
      setAlerts((alerts) => alerts.filter((a) => a.id !== alertId))
    } catch (error) {
      console.error('Error dismissing alert:', error)
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return building ? (
          <AdminOverview
            building={building}
            parkingSpots={parkingSpots}
            alerts={alerts}
            onNavigate={setActiveTab}
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
      case 'parkingOwnership':
        return <ParkingOwnershipPanel />
      case 'payments':
        return <PaymentsPanel payments={payments} />
      case 'comunicaciones':
        return <ComunicacionesPanel communications={communications} />
      case 'assemblies':
        return <AssemblyPanel />
      case 'inbox':
        return (
          <HelpdeskInboxPanel
            buildingId={building?.id || ''}
            residents={residents}
            onOpenDetail={handleOpenTicketDetail}
          />
        )
      case 'pqrs':
        return (
          <PqrsPanel
            buildingId={building?.id || ''}
            residents={residents}
            focusId={focusTarget?.type === 'pqrs' ? focusTarget.id : null}
            onFocusConsumed={() => setFocusTarget(null)}
          />
        )
      case 'convivencia':
        return (
          <ConvivenciaPanel
            buildingId={building?.id || ''}
            focusId={focusTarget?.type === 'infraction' ? focusTarget.id : null}
            onFocusConsumed={() => setFocusTarget(null)}
          />
        )
      case 'maintenance':
        return <MaintenancePanel buildingId={building?.id || ''} />
      case 'utilities':
        return <UtilityPanel buildingId={building?.id || ''} />
      case 'providers':
        return <ProvidersPanel buildingId={building?.id || ''} />
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
      case 'surveys':
        return <SurveysPanel buildingId={building?.id || ''} />
      case 'onboarding':
        return <OnboardingPanel buildingId={building?.id || ''} />
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

        <main className="flex-1 overflow-auto p-4 pb-24 md:p-6 md:pb-6">
          <div className="mx-auto w-full max-w-7xl">
            {loading ? <OverviewSkeleton /> : renderContent()}
          </div>
        </main>
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
