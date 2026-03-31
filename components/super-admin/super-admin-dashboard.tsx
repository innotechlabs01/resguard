'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useAnalyticsTrack } from '@/lib/hooks/useAnalytics'
import { SuperAdminSidebar } from './super-admin-sidebar'
import { SuperAdminHeader } from './super-admin-header'
import { SuperAdminOverview } from './super-admin-overview'
import { BuildingsPanel } from './buildings-panel'
import { GlobalPaymentsPanel } from './global-payments-panel'
import { UsersPanel } from './users-panel'
import { AnalyticsPanel } from './analytics-panel'
import { SystemAlertsPanel } from './system-alerts-panel'
import { SystemSettingsPanel } from './system-settings-panel'
import { ParkingConfigPanel } from './parking-config-panel'
import type { BuildingStats, SystemStats } from '@/lib/types'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Menu, LayoutGrid, Building2, Car, CreditCard, Users, BarChart3, Bell, Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

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
              {item.badge && systemAlerts > 0 && (
                <Badge variant="destructive" className="absolute -right-2 -top-1 h-4 w-4 p-0 text-[10px]">
                  {systemAlerts}
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

function MobileHeader({ title, onMenuClick, systemAlerts }: { title: string; onMenuClick: () => void; systemAlerts: number }) {
  const { logout } = useAuth()
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="h-8 w-8">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-foreground">Super Admin</span>
          <span className="text-[10px] text-muted-foreground truncate">{title}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="h-4 w-4" />
          {systemAlerts > 0 && (
            <Badge variant="destructive" className="absolute -right-1 -top-1 h-4 w-4 p-0 text-[10px]">
              {systemAlerts}
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
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [buildings, setBuildings] = useState<BuildingStats[]>([])
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useAnalyticsTrack(activeTab, 'super-admin')

  // Fetch data from API
  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      try {
        const [buildingsRes, statsRes, usersRes] = await Promise.all([
          fetch('/api/buildings'),
          fetch('/api/stats'),
          fetch('/api/users'),
        ])
        if (!cancelled && buildingsRes.ok) {
          const data = await buildingsRes.json()
          // Map DB buildings to BuildingStats type
          const mapped: BuildingStats[] = (data.buildings || []).map((b: any) => ({
            id: b.id,
            name: b.name,
            address: b.address,
            totalUnits: b.total_units,
            occupiedUnits: 0,
            totalParkingSpots: b.total_parking_spots,
            visitorParkingSpots: b.visitor_parking_spots,
            monthlyRevenue: b.monthly_fee || 0,
            outstandingBalance: b.outstanding_balance || 0,
            lastPaymentDate: b.last_payment_date ? new Date(b.last_payment_date) : undefined,
            subscriptionStatus: b.subscription_status || 'active',
            activeVisitors: 0,
            pendingAlerts: 0,
            status: 'active' as const,
          }))
          setBuildings(mapped)
        }
        if (!cancelled && statsRes.ok) {
          const data = await statsRes.json()
          if (data.stats) {
            setSystemStats({
              totalBuildings: data.stats.total_buildings || 0,
              activeBuildings: data.stats.active_buildings || 0,
              totalResidents: data.stats.total_residents || 0,
              totalRevenue: data.stats.total_revenue || 0,
              monthlyRecurringRevenue: data.stats.monthly_recurring_revenue || 0,
              pendingPayments: data.stats.pending_payments || 0,
              systemAlerts: data.stats.system_alerts || 0,
            })
          }
        }

        if (!cancelled && usersRes.ok) {
          const data = await usersRes.json()
          setUsers(data.users || [])
        }
      } catch (error) {
        console.error('Error fetching super admin data:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (user && user.clerkUserId) {
      fetchData()
    } else {
      setLoading(false)
    }
    return () => { cancelled = true }
  }, [user])

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
        return <BuildingsPanel buildings={buildings} />
      case 'parking':
        return <ParkingConfigPanel />
      case 'payments':
        return <GlobalPaymentsPanel />
      case 'users':
        return <UsersPanel users={users} buildings={buildings} />
      case 'analytics':
        return <AnalyticsPanel buildings={buildings} systemStats={systemStats} />
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
