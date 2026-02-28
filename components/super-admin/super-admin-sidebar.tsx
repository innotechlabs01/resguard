'use client'

import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Users,
  BarChart3,
  Settings,
  Bell,
  MessageSquare,
  LogOut,
  Shield,
  Car,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/lib/auth-context'

interface SuperAdminSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  systemAlerts: number
}

const navItems = [
  { id: 'overview', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'buildings', icon: Building2, label: 'Edificios' },
  { id: 'parking', icon: Car, label: 'Parqueaderos' },
  { id: 'payments', icon: CreditCard, label: 'Pagos y Facturacion' },
  { id: 'users', icon: Users, label: 'Usuarios' },
  { id: 'analytics', icon: BarChart3, label: 'Analiticas' },
  { id: 'alerts', icon: Bell, label: 'Alertas del Sistema', badge: true },
  { id: 'concierge', icon: MessageSquare, label: 'AI Concierge' },
  { id: 'settings', icon: Settings, label: 'Configuracion' },
]

export function SuperAdminSidebar({ activeTab, onTabChange, systemAlerts }: SuperAdminSidebarProps) {
  const { logout } = useAuth()

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Header */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-sidebar-foreground">ResGuard</span>
          <span className="text-xs text-muted-foreground">Super Admin</span>
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
                {item.badge && systemAlerts > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5 px-1.5">
                    {systemAlerts}
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
