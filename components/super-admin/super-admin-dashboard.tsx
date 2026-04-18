'use client'

import { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useAnalyticsTrack } from '@/lib/hooks/useAnalytics'
import { SuperAdminSidebar } from './super-admin-sidebar'
import { SuperAdminHeader } from './super-admin-header'
import { SuperAdminOverview } from './super-admin-overview'
import { BuildingsPanel } from './buildings-panel'
import { GlobalPaymentsPanel } from './global-payments-panel'
import { UsersPanel } from './users-panel'
import { SystemAlertsPanel } from './system-alerts-panel'
import { SystemSettingsPanel } from './system-settings-panel'
import type { BuildingStats, SystemStats } from '@/lib/types'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Menu, LayoutGrid, Building2, Car, CreditCard, Users, BarChart3, Bell, Settings, LogOut, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { SkeletonCard } from '@/components/ui/skeleton-loaders'

const AnalyticsPanel = lazy(() => import('@/components/super-admin/analytics-panel').then(m => ({ default: m.AnalyticsPanel })))
const ParkingConfigPanel = lazy(() => import('@/components/super-admin/parking-config-panel').then(m => ({ default: m.ParkingConfigPanel })))

const tabTitles: Record<string, string> = {
  overview: 'Dashboard Global',
  buildings: 'Gestion de Edificios',
  parking: 'Configuracion Parqueaderos',
  payments: 'Pagos y Facturacion',
  users: 'Gestion de Usuarios',
  analytics: 'Analiticas del Sistema',
  alerts: 'Alertas del Sistema',
  settings: 'Configuracion del Sistema',
}

const navItems = [
  { id: 'overview', icon: LayoutGrid, label: 'Dashboard' },
  { id: 'buildings', icon: Building2, label: 'Edificios' },
  { id: 'parking', icon: Car, label: 'Parqueaderos' },
  { id: 'payments', icon: CreditCard, label: 'Pagos' },
  { id: 'users', icon: Users, label: 'Usuarios' },
  { id: 'analytics', icon: BarChart3, label: 'Analiticas' },
  { id: 'alerts', icon: Bell, label: 'Alertas', badge: true },
  { id: 'settings', icon: Settings, label: 'Configuracion' },
]

function MobileNav({ activeTab, onTabChange, systemAlerts }: { activeTab: string; onTabChange: (tab: string) => void; systemAlerts: number }) {
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
                {item.badge && systemAlerts > 0 && (
                  <Badge variant="destructive" className="absolute -right-1.5 -top-1 h-3.5 w-3.5 p-0 text-[8px]">
                    {systemAlerts > 9 ? '9+' : systemAlerts}
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

function MobileHeader({ title, onMenuClick, systemAlerts }: { title: string; onMenuClick: () => void; systemAlerts: number }) {
  const { logout } = useAuth()
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
          {systemAlerts > 0 && (
            <Badge variant="destructive" className="absolute -right-0.5 -top-0.5 h-4 w-4 p-0 text-[10px]">
              {systemAlerts > 9 ? '9+' : systemAlerts}
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

export function SuperAdminDashboard() {
  const { user, isAuthenticated, isDemoMode, isLoaded } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [buildings, setBuildings] = useState<BuildingStats[]>([])
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useAnalyticsTrack(activeTab, 'super-admin')

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
              <Shield className="h-6 w-6" />
              Modo Demo
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Inicia sesión para acceder al panel de Super Admin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Este panel solo está disponible para usuarios con rol de Super Admin autenticados con Clerk.
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
        // Use cache: 'no-store' to always get fresh data
        const fetchOptions = { cache: 'no-store' as RequestCache }

        const [buildingsRes, statsRes, usersRes] = await Promise.all([
          fetch('/api/buildings', fetchOptions),
          fetch('/api/stats', fetchOptions),
          fetch('/api/users', fetchOptions),
        ])

        if (!cancelled && buildingsRes.ok) {
          const data = await buildingsRes.json()
          // API returns array directly
          const buildingsData = Array.isArray(data) ? data : (data.buildings || [])
          const mapped: BuildingStats[] = buildingsData.map((b: any) => ({
            id: b.id,
            name: b.name,
            address: b.address || '',
            totalUnits: b.totalUnits || b.total_units || 0,
            occupiedUnits: b.occupiedUnits || 0,
            totalParkingSpots: b.totalParkingSpots || b.total_parking_spots || 0,
            visitorParkingSpots: b.visitorParkingSpots || b.visitor_parking_spots || 0,
            monthlyRevenue: b.monthlyRevenue || b.monthly_fee || 0,
            outstandingBalance: b.outstandingBalance || b.outstanding_balance || 0,
            lastPaymentDate: b.lastPaymentDate || b.last_payment_date ? new Date(b.last_payment_date || b.lastPaymentDate) : undefined,
            subscriptionStatus: b.subscriptionStatus || b.subscription_status || 'active',
            activeVisitors: b.activeVisitors || 0,
            pendingAlerts: b.pendingAlerts || 0,
            status: (b.status || 'active') as 'active' | 'inactive' | 'maintenance',
          }))
          setBuildings(mapped)
        }

        if (!cancelled && statsRes.ok) {
          const data = await statsRes.json()
          const statsData = data.stats || data
          if (statsData) {
            setSystemStats({
              totalBuildings: statsData.total_buildings || statsData.totalBuildings || 0,
              activeBuildings: statsData.active_buildings || statsData.activeBuildings || 0,
              totalResidents: statsData.total_residents || statsData.totalResidents || 0,
              totalRevenue: statsData.total_revenue || statsData.totalRevenue || 0,
              monthlyRecurringRevenue: statsData.monthly_recurring_revenue || statsData.monthlyRecurringRevenue || 0,
              pendingPayments: statsData.pending_payments || statsData.pendingPayments || 0,
              systemAlerts: statsData.system_alerts || statsData.systemAlerts || 0,
            })
          }
        }

        if (!cancelled && usersRes.ok) {
          const data = await usersRes.json()
          const usersData = Array.isArray(data) ? data : (data.users || [])
          if (usersData.length > 0) {
            setUsers(usersData)
          }
        }
      } catch (error) {
        console.error('Error fetching super admin data:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (user) {
      fetchData()
    } else {
      setLoading(false)
    }

    return () => { cancelled = true }
  }, [user, isAuthenticated, refreshKey])

  const handleRefresh = () => {
    setRefreshKey(k => k + 1)
  }

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'F1') {
      e.preventDefault()
      setActiveTab('buildings')
    } else if (e.key === 'F2') {
      e.preventDefault()
      setActiveTab('payments')
    } else if (e.key === 'F3') {
      e.preventDefault()
      setActiveTab('alerts')
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const defaultStats: SystemStats = {
    totalBuildings: 0,
    activeBuildings: 0,
    totalResidents: 0,
    totalRevenue: 0,
    monthlyRecurringRevenue: 0,
    pendingPayments: 0,
    systemAlerts: 0,
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando datos...</p>
      </div>
    )
  }

  const renderContent = () => {
    const stats = systemStats || defaultStats
    switch (activeTab) {
      case 'overview':
        return (
          <SuperAdminOverview
            systemStats={stats}
            buildings={buildings}
          />
        )
      case 'buildings':
        return <BuildingsPanel buildings={buildings} onRefresh={handleRefresh} />
      case 'parking':
        return (
          <Suspense fallback={<SkeletonCard className="h-[400px]" />}>
            <ParkingConfigPanel />
          </Suspense>
        )
      case 'payments':
        return <GlobalPaymentsPanel />
      case 'users':
        return <UsersPanel users={users} buildings={buildings} />
      case 'analytics':
        return (
          <Suspense fallback={<SkeletonCard className="h-[400px]" />}>
            <AnalyticsPanel buildings={buildings} systemStats={systemStats} />
          </Suspense>
        )
      case 'alerts':
        return <SystemAlertsPanel />
      case 'settings':
        return <SystemSettingsPanel />
      default:
        return null
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <SuperAdminSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          systemAlerts={(systemStats || defaultStats).systemAlerts}
        />
      </div>

      {/* Mobile Sheet Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SuperAdminSidebar
            activeTab={activeTab}
            onTabChange={(tab) => { setActiveTab(tab); setSidebarOpen(false) }}
            systemAlerts={(systemStats || defaultStats).systemAlerts}
          />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <MobileHeader 
          title={tabTitles[activeTab]} 
          onMenuClick={() => setSidebarOpen(true)}
          systemAlerts={(systemStats || defaultStats).systemAlerts}
        />

        {/* Desktop Header */}
        <div className="hidden md:block">
          <SuperAdminHeader
            title={tabTitles[activeTab]}
            systemAlerts={(systemStats || defaultStats).systemAlerts}
          />
        </div>

        <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">{renderContent()}</main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        systemAlerts={(systemStats || defaultStats).systemAlerts}
      />
    </div>
  )
}
