'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Car,
  Users,
  Bell,
  MessageSquare,
  LayoutDashboard,
  LogOut,
  Shield,
  FileText,
  KeyRound,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  unreadAlerts: number
}

const navItems = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'parking', label: 'Mapa de Parqueos', icon: Car },
  { id: 'visitors', label: 'Registro de Visitas', icon: Users },
  { id: 'inquilinos', label: 'Inquilinos / Vehiculos', icon: KeyRound },
  { id: 'alerts', label: 'Alertas', icon: Bell },
  { id: 'concierge', label: 'Asistente Virtual', icon: MessageSquare },
  { id: 'reports', label: 'Reportes de Turno', icon: FileText },
]

export function Sidebar({ activeTab, onTabChange, unreadAlerts }: SidebarProps) {
  const { user, logout } = useAuth()

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-sidebar-foreground">ResGuard</h1>
          <p className="text-xs text-muted-foreground">Modulo de Seguridad</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          const showBadge = item.id === 'alerts' && unreadAlerts > 0

          return (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                'w-full justify-start gap-3 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isActive && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
              )}
              onClick={() => onTabChange(item.id)}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
              {showBadge && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-medium text-destructive-foreground">
                  {unreadAlerts}
                </span>
              )}
            </Button>
          )
        })}
      </nav>

      {/* Keyboard shortcuts */}
      <div className="border-t border-sidebar-border px-4 py-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Atajos de teclado</p>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Nuevo ingreso</span>
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">F1</kbd>
          </div>
          <div className="flex justify-between">
            <span>Visitantes</span>
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">F2</kbd>
          </div>
          <div className="flex justify-between">
            <span>Alertas</span>
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">F3</kbd>
          </div>
        </div>
      </div>

      {/* User footer */}
      <div className="border-t border-sidebar-border p-3">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/20 text-xs font-semibold text-success shrink-0">
            {user?.name?.charAt(0) ?? 'V'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name ?? 'Vigilante'}</p>
            <p className="text-xs text-muted-foreground">Vigilante en turno</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesion
        </Button>
      </div>
    </aside>
  )
}
