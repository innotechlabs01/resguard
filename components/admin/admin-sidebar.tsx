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
  CalendarDays,
  Ticket,
  MessageSquare,
  Wrench,
  ShieldAlert,
  Droplets,
  Store,
  ClipboardCheck,
  UserPlus,
  Bot,
  Inbox,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
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

type NavItem = { id: string; icon: LucideIcon; label: string; badge?: boolean }

const navSections: { label: string; items: NavItem[] }[] = [
  {
    label: 'General',
    items: [
      { id: 'overview', icon: LayoutDashboard, label: 'Dashboard' },
      { id: 'inbox', icon: Inbox, label: 'Inbox' },
      { id: 'alerts', icon: Bell, label: 'Alertas', badge: true },
      { id: 'reports', icon: FileText, label: 'Reportes' },
    ],
  },
  {
    label: 'Comunidad',
    items: [
      { id: 'residents', icon: Users, label: 'Residentes' },
      { id: 'comunicaciones', icon: Send, label: 'Comunicaciones' },
      { id: 'chat', icon: MessageSquare, label: 'Mensajes' },
      { id: 'assemblies', icon: CalendarDays, label: 'Asambleas' },
      { id: 'surveys', icon: ClipboardCheck, label: 'Encuestas' },
      { id: 'onboarding', icon: UserPlus, label: 'Onboarding' },
    ],
  },
  {
    label: 'Operación',
    items: [
      { id: 'parking', icon: Car, label: 'Parqueaderos' },
      { id: 'visitorParking', icon: CarFront, label: 'Visitantes' },
      { id: 'parkingOwnership', icon: Car, label: 'Parqueaderos Asignados' },
      { id: 'payments', icon: CreditCard, label: 'Pagos y Cobros' },
      { id: 'maintenance', icon: Wrench, label: 'Mantenimiento' },
      { id: 'utilities', icon: Droplets, label: 'Servicios' },
      { id: 'providers', icon: Store, label: 'Proveedores' },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { id: 'pqrs', icon: Ticket, label: 'PQRS' },
      { id: 'convivencia', icon: ShieldAlert, label: 'Convivencia' },
      { id: 'concierge', icon: Bot, label: 'Concierge' },
      { id: 'settings', icon: Settings, label: 'Configuración' },
    ],
  },
]

export function AdminSidebar({ activeTab, onTabChange, unreadAlerts, buildingName }: AdminSidebarProps) {
  const { logout } = useAuth()

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Header */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft">
          <Building2 className="h-5 w-5 text-brand" />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="text-sm font-semibold text-sidebar-foreground">Panel Admin</span>
          <span className="truncate text-xs text-muted-foreground">{buildingName}</span>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-5">
          {navSections.map((section) => (
            <div key={section.label} className="space-y-1">
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.label}
              </p>
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={cn(
                      'h-9 w-full justify-start gap-3 text-sm font-normal text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                      isActive &&
                        'bg-brand-soft font-medium text-brand hover:bg-brand-soft hover:text-brand',
                    )}
                    onClick={() => onTabChange(item.id)}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate text-left">{item.label}</span>
                    {item.badge && unreadAlerts > 0 && (
                      <Badge variant="destructive" className="h-5 min-w-5 justify-center px-1.5">
                        {unreadAlerts > 9 ? '9+' : unreadAlerts}
                      </Badge>
                    )}
                  </Button>
                )
              })}
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          className="h-9 w-full justify-start gap-3 text-sm font-normal text-sidebar-foreground/75 hover:bg-destructive/10 hover:text-destructive"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar Sesión</span>
        </Button>
      </div>
    </aside>
  )
}
