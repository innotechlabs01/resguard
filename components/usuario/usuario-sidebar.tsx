'use client'

import {
  LayoutDashboard,
  Car,
  Receipt,
  Calendar,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  Home,
  ShoppingBag,
  KeyRound,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { Badge } from '@/components/ui/badge'

interface UsuarioSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  unreadNotifications: number
  unit: string
}

const menuItems = [
  { id: 'overview', label: 'Inicio', icon: LayoutDashboard },
  { id: 'parking', label: 'Parqueadero Visitas', icon: Car },
  { id: 'marketplace', label: 'Mercado Vecinal', icon: ShoppingBag },
  { id: 'alquiler', label: 'Alquiler e Inquilinos', icon: KeyRound },
  { id: 'payments', label: 'Pagos', icon: Receipt },
  { id: 'reservations', label: 'Reservas', icon: Calendar },
  { id: 'notifications', label: 'Notificaciones', icon: Bell },
  { id: 'concierge', label: 'Asistente Virtual', icon: MessageSquare },
  { id: 'settings', label: 'Mi Cuenta', icon: Settings },
]

export function UsuarioSidebar({
  activeTab,
  onTabChange,
  unreadNotifications,
  unit,
}: UsuarioSidebarProps) {
  const { logout } = useAuth()

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-sidebar">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
          <Home className="h-5 w-5 text-warning" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-sidebar-foreground">ResGuard</span>
          <span className="text-xs text-sidebar-foreground/60">Apto {unit}</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          const showBadge = item.id === 'notifications' && unreadNotifications > 0

          return (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                'w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isActive && 'bg-sidebar-accent text-sidebar-accent-foreground'
              )}
              onClick={() => onTabChange(item.id)}
            >
              <Icon className="h-4 w-4" />
              {item.label}
              {showBadge && (
                <Badge
                  variant="destructive"
                  className="ml-auto h-5 min-w-[20px] px-1.5 text-xs"
                >
                  {unreadNotifications}
                </Badge>
              )}
            </Button>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesion
        </Button>
      </div>
    </aside>
  )
}
