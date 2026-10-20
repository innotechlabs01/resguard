'use client'

import {
  Users,
  Car,
  Bell,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  CalendarClock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { BuildingStats, ParkingSpot, Alert } from '@/lib/types'

interface AdminOverviewProps {
  building: BuildingStats
  parkingSpots: ParkingSpot[]
  alerts: Alert[]
  onNavigate?: (tab: string) => void
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    notation: 'compact',
  }).format(amount)
}

function formatRelative(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.round(hours / 24)
  return `hace ${days} d`
}

/** Small tinted icon chip used across the KPI cards for visual rhythm. */
function IconChip({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-lg',
        className,
      )}
    >
      {children}
    </span>
  )
}

const PRIORITY_STYLES: Record<string, string> = {
  critical: 'bg-destructive-container text-destructive-on-container',
  high: 'bg-warning-container text-warning-on-container',
  medium: 'bg-info-container text-info-on-container',
  low: 'bg-muted text-muted-foreground',
}

export function AdminOverview({ building, parkingSpots, alerts, onNavigate }: AdminOverviewProps) {
  const occupancyRate =
    building.totalUnits > 0
      ? Math.round((building.occupiedUnits / building.totalUnits) * 100)
      : 0
  const parkingOccupied = parkingSpots.filter((s) => s.status !== 'available').length
  const parkingAvailable = parkingSpots.filter((s) => s.status === 'available').length
  const overtimeSpots = parkingSpots.filter((s) => s.status === 'overtime').length
  const unreadAlerts = alerts.filter((a) => !a.read).length
  const criticalAlerts = alerts.filter((a) => a.priority === 'critical' && !a.read).length
  const recentAlerts = [...alerts].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 4)

  const subscriptionActive =
    !building.subscriptionStatus || building.subscriptionStatus === 'active'

  return (
    <div className="space-y-6">
      {/* ---- Page header ---- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Resumen del edificio
            </h1>
            <Badge
              variant="outline"
              className={cn(
                'gap-1 border-transparent',
                subscriptionActive
                  ? 'bg-success-container text-success-on-container'
                  : 'bg-warning-container text-warning-on-container',
              )}
            >
              <CheckCircle2 className="h-3 w-3" />
              {subscriptionActive ? 'Suscripción activa' : 'Revisar suscripción'}
            </Badge>
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {building.name}
            {building.address ? ` · ${building.address}` : ''}
          </p>
        </div>

        {onNavigate && (
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onNavigate('reports')}>
              Ver reportes
            </Button>
            <Button size="sm" className="gap-2" onClick={() => onNavigate('residents')}>
              Gestionar residentes
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* ---- Key metrics ---- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ocupación
            </CardTitle>
            <IconChip className="bg-brand-soft text-brand">
              <Users className="h-4 w-4" />
            </IconChip>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">
              {building.occupiedUnits}
              <span className="text-base font-normal text-muted-foreground">
                /{building.totalUnits} unidades
              </span>
            </div>
            <Progress value={occupancyRate} className="mt-3 h-1.5" />
            <p className="mt-2 text-xs text-muted-foreground">{occupancyRate}% ocupado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cuota mensual
            </CardTitle>
            <IconChip className="bg-info-container text-info-on-container">
              <DollarSign className="h-4 w-4" />
            </IconChip>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">
              {formatCurrency(building.monthlyRevenue)}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Valor registrado por unidad</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cartera pendiente
            </CardTitle>
            <IconChip className="bg-warning-container text-warning-on-container">
              <AlertTriangle className="h-4 w-4" />
            </IconChip>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-warning">
              {formatCurrency(building.outstandingBalance)}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {building.outstandingBalance > 0
                ? 'Saldo por recaudar'
                : 'Sin saldo pendiente'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alertas sin leer
            </CardTitle>
            <IconChip className="bg-destructive-container text-destructive-on-container">
              <Bell className="h-4 w-4" />
            </IconChip>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">{unreadAlerts}</div>
            {criticalAlerts > 0 ? (
              <Badge
                variant="outline"
                className="mt-2 gap-1 border-transparent bg-destructive-container text-destructive-on-container"
              >
                {criticalAlerts} críticas
              </Badge>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">Sin alertas críticas</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ---- Secondary panels ---- */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Parking */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-foreground">
              <Car className="h-4 w-4 text-brand" />
              Parqueaderos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {parkingSpots.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Sin parqueaderos registrados
              </p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-muted p-3">
                    <div className="text-xl font-semibold text-foreground">{parkingOccupied}</div>
                    <p className="mt-0.5 text-xs text-muted-foreground">Ocupados</p>
                  </div>
                  <div className="rounded-lg bg-success-container p-3">
                    <div className="text-xl font-semibold text-success-on-container">
                      {parkingAvailable}
                    </div>
                    <p className="mt-0.5 text-xs text-success-on-container/80">Libres</p>
                  </div>
                  <div className="rounded-lg bg-destructive-container p-3">
                    <div className="text-xl font-semibold text-destructive-on-container">
                      {overtimeSpots}
                    </div>
                    <p className="mt-0.5 text-xs text-destructive-on-container/80">Excedidos</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {parkingSpots.length} espacios monitoreados en total
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Visitors */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-foreground">
              <Users className="h-4 w-4 text-brand" />
              Visitantes activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center rounded-lg bg-muted py-6">
              <span className="text-4xl font-semibold text-foreground">
                {building.activeVisitors}
              </span>
              <p className="mt-1 text-sm text-muted-foreground">en el edificio ahora</p>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Espacios de visitantes configurados: {building.visitorParkingSpots}
            </p>
          </CardContent>
        </Card>

        {/* Recent alerts */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-foreground">
              <CalendarClock className="h-4 w-4 text-brand" />
              Alertas recientes
            </CardTitle>
            {onNavigate && alerts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onNavigate('alerts')}
              >
                Ver todas
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {recentAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-success" />
                <p className="mt-2 text-sm text-muted-foreground">Sin alertas recientes</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {recentAlerts.map((alert) => (
                  <li key={alert.id} className="flex items-start gap-3">
                    <span
                      className={cn(
                        'mt-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase',
                        PRIORITY_STYLES[alert.priority] ?? PRIORITY_STYLES.low,
                      )}
                    >
                      {alert.priority}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {alert.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelative(alert.timestamp)}
                        {!alert.read && ' · sin leer'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
