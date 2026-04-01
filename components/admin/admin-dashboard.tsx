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
import { Menu, LayoutDashboard, Users, Car, CreditCard, FileText, Settings, Bell, LogOut, Building2, Send, CarFront } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { SkeletonCard } from '@/components/ui/skeleton-loaders'

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
  { id: 'alerts', icon: Bell, label: 'Alertas', badge: true },
  { id: 'reports', icon: FileText, label: 'Reportes' },
  { id: 'settings', icon: Settings, label: 'Configuracion' },
]

function MobileNav({ activeTab, onTabChange, unreadAlerts }: { activeTab: string; onTabChange: (tab: string) => void; unreadAlerts: number }) {
  const visibleItems = navItems.slice(0, 5)
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border bg-card px-2 py-2 md:hidden">
      {visibleItems.map((item) => {
        const Icon = item.icon
        const isActive = activeTab === item.id
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-xs',
              isActive ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <div className="relative">
              <Icon className="h-5 w-5" />
              {item.badge && unreadAlerts > 0 && (
                <Badge variant="destructive" className="absolute -right-2 -top-1 h-4 w-4 p-0 text-[10px]">
                  {unreadAlerts}
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

function MobileHeader({ title, onMenuClick, unreadAlerts }: { title: string; onMenuClick: () => void; unreadAlerts: number }) {
  const { user, logout } = useAuth()
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="h-8 w-8">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-foreground">Admin Panel</span>
          <span className="text-[10px] text-muted-foreground truncate">{title}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="h-4 w-4" />
          {unreadAlerts > 0 && (
            <Badge variant="destructive" className="absolute -right-1 -top-1 h-4 w-4 p-0 text-[10px]">
              {unreadAlerts}
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
  const { user } = useAuth()
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
