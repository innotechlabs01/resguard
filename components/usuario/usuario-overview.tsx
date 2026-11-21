'use client'

import {
  Car,
  Receipt,
  Calendar,
  Bell,
  Clock,
  CheckCircle,
  AlertTriangle,
  ShoppingBag,
  KeyRound,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'

interface UsuarioOverviewProps {
  residentName: string
  unit: string
  balance: number
  pendingRequests: number
  activeReservations: number
  notifications: number
  onTabChange?: (tab: string) => void
  communications?: any[]
}

export function UsuarioOverview({
  residentName,
  unit,
  balance,
  pendingRequests,
  activeReservations,
  notifications,
  onTabChange,
  communications: propCommunications,
}: UsuarioOverviewProps) {
  const { user } = useAuth()
  const buildingName = user?.buildingName || 'Mi Copropiedad'
  const latestComms = (propCommunications || []).slice(0, 2)
  const recentActivity = (propCommunications || []).slice(0, 3)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="rounded-lg border border-border bg-gradient-to-r from-warning/10 to-warning/5 p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
          Bienvenido, {residentName}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Apartamento {unit} - {buildingName}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Estado de Cuenta
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-xl sm:text-2xl font-bold ${balance < 0 ? 'text-destructive' : 'text-success'}`}>
              {formatCurrency(Math.abs(balance))}
            </div>
            <p className="text-xs text-muted-foreground">
              {balance < 0 ? 'Saldo pendiente' : 'Al dia'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Solicitudes de Parqueo
            </CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">{pendingRequests}</div>
            <p className="text-xs text-muted-foreground">Pendientes de aprobar</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reservas Activas
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">{activeReservations}</div>
            <p className="text-xs text-muted-foreground">Esta semana</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Notificaciones
            </CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">{notifications}</div>
            <p className="text-xs text-muted-foreground">Sin leer</p>
          </CardContent>
        </Card>
      </div>

      {/* Emprendimiento & Alquiler highlight cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card
          className="border-warning/30 bg-warning/5 cursor-pointer hover:bg-warning/10 transition-colors"
          onClick={() => onTabChange?.('marketplace')}
        >
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-warning/20">
                <ShoppingBag className="h-6 w-6 text-warning" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Mercado Vecinal</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Publica y descubre productos y servicios de emprendedores del edificio. Impulsa el comercio local.
                </p>
                <Button size="sm" variant="ghost" className="mt-2 h-7 px-0 text-warning hover:bg-transparent hover:text-warning/80">
                  Explorar mercado <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-primary/30 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
          onClick={() => onTabChange?.('alquiler')}
        >
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/20">
                <KeyRound className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Alquiler e Inquilinos</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Publica tu apto o parqueadero, gestiona inquilinos y vehiculos de arrendatarios.
                </p>
                <Button size="sm" variant="ghost" className="mt-2 h-7 px-0 text-primary hover:bg-transparent hover:text-primary/80">
                  Gestionar alquiler <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Acciones Rapidas</CardTitle>
            <CardDescription>Gestiona tus solicitudes y reservas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start gap-3 bg-transparent" variant="outline" onClick={() => onTabChange?.('parking')}>
              <Car className="h-4 w-4" />
              Solicitar Parqueo para Visitante
            </Button>
            <Button className="w-full justify-start gap-3 bg-transparent" variant="outline" onClick={() => onTabChange?.('reservations')}>
              <Calendar className="h-4 w-4" />
              Reservar Area Comun
            </Button>
            <Button className="w-full justify-start gap-3 bg-transparent" variant="outline" onClick={() => onTabChange?.('payments')}>
              <Receipt className="h-4 w-4" />
              Ver Estado de Cuenta
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Actividad Reciente</CardTitle>
            <CardDescription>Ultimos movimientos en tu cuenta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                <Clock className="mb-2 h-6 w-6 opacity-40" />
                <p className="text-sm">Sin actividad reciente</p>
              </div>
            ) : (
              recentActivity.map((item) => {
                const sentDate = item.sentAt ? new Date(item.sentAt) : new Date(item.sent_at ?? item.created_at ?? Date.now())
                const dateLabel = !isNaN(sentDate.getTime())
                  ? sentDate.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
                  : ''
                return (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Bell className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {dateLabel ? `${dateLabel} - ` : ''}{item.authorName ?? item.author_name ?? 'Administración'}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Live comms from admin */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Ultimas Comunicaciones</CardTitle>
            <CardDescription>Avisos y circulares de la administracion</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="text-primary" onClick={() => onTabChange?.('notifications')}>
            Ver todas <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {latestComms.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No hay comunicaciones recientes.
            </p>
          ) : (
            latestComms.map((comm) => {
              const urgentColors: Record<string, string> = {
                urgent: 'border-destructive/30 bg-destructive/5',
                high: 'border-warning/30 bg-warning/5',
                normal: 'border-primary/30 bg-primary/5',
                low: 'border-border bg-muted/20',
              }
              const iconColors: Record<string, string> = {
                urgent: 'text-destructive',
                high: 'text-warning',
                normal: 'text-primary',
                low: 'text-muted-foreground',
              }
              const sentDate = comm.sentAt ? new Date(comm.sentAt) : new Date(comm.sent_at ?? comm.created_at ?? Date.now())
              return (
                <div
                  key={comm.id}
                  className={`flex items-start gap-4 rounded-lg border p-4 ${urgentColors[comm.priority] || urgentColors.normal}`}
                >
                  <AlertTriangle className={`mt-0.5 h-5 w-5 shrink-0 ${iconColors[comm.priority] || iconColors.normal}`} />
                  <div className="min-w-0">
                    <h4 className="font-medium text-foreground">{comm.title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{comm.message ?? comm.content}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{comm.authorName ?? comm.author_name ?? 'Administración'}</Badge>
                      {!isNaN(sentDate.getTime()) && (
                        <span className="text-xs text-muted-foreground">
                          {sentDate.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
