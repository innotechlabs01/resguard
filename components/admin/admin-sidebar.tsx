'use client'

import {
  LayoutDashboard,
  Users,
  Car,
  CreditCard,
  FileText,
  Settings,
  Bell,
  LogOut,
  Building2,
  Send,
  CarFront,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/lib/auth-context'

interface AdminSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  unreadAlerts: number
  buildingName: string
}

const navItems = [
  { id: 'overview', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'residents', icon: Users, label: 'Residentes' },
  { id: 'parking', icon: Car, label: 'Parqueaderos' },
  { id: 'visitorParking', icon: CarFront, label: 'Visitantes' },
  { id: 'payments', icon: CreditCard, label: 'Pagos y Cobros' },
  { id: 'comunicaciones', icon: Send, label: 'Comunicaciones' },
  { id: 'alerts', icon: Bell, label: 'Alertas', badge: true },
  { id: 'reports', icon: FileText, label: 'Reportes' },
  { id: 'settings', icon: Settings, label: 'Configuracion' },
]

export function AdminSidebar({ activeTab, onTabChange, unreadAlerts, buildingName }: AdminSidebarProps) {
  const { logout } = useAuth()

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Header */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-sidebar-foreground">Admin Panel</span>
          <span className="text-xs text-muted-foreground truncate max-w-[140px]">{buildingName}</span>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  'w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                  isActive && 'bg-sidebar-accent text-sidebar-foreground'
                )}
                onClick={() => onTabChange(item.id)}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && unreadAlerts > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5 px-1.5">
                    {unreadAlerts}
                  </Badge>
                )}
              </Button>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar Sesion</span>
        </Button>
      </div>
    </aside>
  )
}
