'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  Building2,
  CreditCard,
  Users,
  Server,
  Check,
  Trash2,
  Filter,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface SystemAlert {
  id: string
  type: 'payment' | 'building' | 'user' | 'system'
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  buildingName?: string
  timestamp: Date
  read: boolean
}

const mockSystemAlerts: SystemAlert[] = [
  {
    id: '1',
    type: 'payment',
    priority: 'critical',
    title: 'Pago de suscripcion fallido',
    message: 'El pago mensual de Conjunto La Esperanza ha fallido. Cuenta en riesgo de suspension.',
    buildingName: 'Conjunto La Esperanza',
    timestamp: new Date(Date.now() - 2 * 60 * 60000),
    read: false,
  },
  {
    id: '2',
    type: 'building',
    priority: 'high',
    title: 'Alta morosidad detectada',
    message: 'Mirador de la Sabana tiene 15% de residentes en mora. Se recomienda accion.',
    buildingName: 'Mirador de la Sabana',
    timestamp: new Date(Date.now() - 4 * 60 * 60000),
    read: false,
  },
  {
    id: '3',
    type: 'system',
    priority: 'medium',
    title: 'Mantenimiento programado',
    message: 'Actualizacion del sistema programada para el 25 de enero a las 2:00 AM.',
    timestamp: new Date(Date.now() - 12 * 60 * 60000),
    read: false,
  },
  {
    id: '4',
    type: 'user',
    priority: 'low',
    title: 'Nuevo administrador registrado',
    message: 'Pedro Gomez ha sido asignado como administrador de Residencias del Sol.',
    buildingName: 'Residencias del Sol',
    timestamp: new Date(Date.now() - 24 * 60 * 60000),
    read: true,
  },
  {
    id: '5',
    type: 'payment',
    priority: 'high',
    title: 'Cartera vencida incremento',
    message: 'La cartera vencida total del sistema ha incrementado un 20% este mes.',
    timestamp: new Date(Date.now() - 6 * 60 * 60000),
    read: false,
  },
]

const priorityConfig = {
  critical: { icon: XCircle, label: 'Critico', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  high: { icon: AlertTriangle, label: 'Alto', className: 'bg-warning/10 text-warning border-warning/20' },
  medium: { icon: Info, label: 'Medio', className: 'bg-info/10 text-info border-info/20' },
  low: { icon: CheckCircle2, label: 'Bajo', className: 'bg-success/10 text-success border-success/20' },
}

const typeConfig = {
  payment: { icon: CreditCard, label: 'Pagos' },
  building: { icon: Building2, label: 'Edificio' },
  user: { icon: Users, label: 'Usuario' },
  system: { icon: Server, label: 'Sistema' },
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'Hace un momento'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `Hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `Hace ${days}d`
}

export function SystemAlertsPanel() {
  const [alerts, setAlerts] = useState<SystemAlert[]>(mockSystemAlerts)

  const unreadCount = alerts.filter((a) => !a.read).length
  const criticalCount = alerts.filter((a) => a.priority === 'critical' && !a.read).length

  const handleMarkRead = (alertId: string) => {
    setAlerts((alerts) =>
      alerts.map((a) => (a.id === alertId ? { ...a, read: true } : a))
    )
  }

  const handleMarkAllRead = () => {
    setAlerts((alerts) => alerts.map((a) => ({ ...a, read: true })))
  }

  const handleDismiss = (alertId: string) => {
    setAlerts((alerts) => alerts.filter((a) => a.id !== alertId))
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alertas Sin Leer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{unreadCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Criticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alta Prioridad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {alerts.filter((a) => a.priority === 'high' && !a.read).length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{alerts.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-foreground">Todas las Alertas</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              <Check className="mr-2 h-4 w-4" />
              Marcar todo como leido
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4 bg-muted">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="critical">Criticas</TabsTrigger>
              <TabsTrigger value="unread">Sin leer</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <AlertsList 
                alerts={alerts} 
                onMarkRead={handleMarkRead} 
                onDismiss={handleDismiss} 
              />
            </TabsContent>
            <TabsContent value="critical">
              <AlertsList 
                alerts={alerts.filter((a) => a.priority === 'critical')} 
                onMarkRead={handleMarkRead} 
                onDismiss={handleDismiss} 
              />
            </TabsContent>
            <TabsContent value="unread">
              <AlertsList 
                alerts={alerts.filter((a) => !a.read)} 
                onMarkRead={handleMarkRead} 
                onDismiss={handleDismiss} 
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

function AlertsList({
  alerts,
  onMarkRead,
  onDismiss,
}: {
  alerts: SystemAlert[]
  onMarkRead: (id: string) => void
  onDismiss: (id: string) => void
}) {
  if (alerts.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No hay alertas para mostrar
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const priority = priorityConfig[alert.priority]
        const type = typeConfig[alert.type]
        const PriorityIcon = priority.icon
        const TypeIcon = type.icon

        return (
          <div
            key={alert.id}
            className={`flex items-start gap-4 rounded-lg border p-4 transition-colors ${
              alert.read ? 'bg-muted/30 border-border' : `border ${priority.className}`
            }`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${priority.className}`}>
              <PriorityIcon className="h-5 w-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={`font-medium ${alert.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                  {alert.title}
                </h4>
                {!alert.read && (
                  <Badge variant="secondary" className="text-xs">Nuevo</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <TypeIcon className="h-3 w-3" />
                  {type.label}
                </div>
                {alert.buildingName && (
                  <div className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {alert.buildingName}
                  </div>
                )}
                <span>{formatTimeAgo(alert.timestamp)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {!alert.read && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onMarkRead(alert.id)}
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => onDismiss(alert.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
