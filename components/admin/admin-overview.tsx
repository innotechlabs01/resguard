'use client'

import {
  Users,
  Car,
  Bell,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { BuildingStats, ParkingSpot, Alert } from '@/lib/types'

interface AdminOverviewProps {
  building: BuildingStats
  parkingSpots: ParkingSpot[]
  alerts: Alert[]
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    notation: 'compact',
  }).format(amount)
}

export function AdminOverview({ building, parkingSpots, alerts }: AdminOverviewProps) {
  const occupancyRate = Math.round((building.occupiedUnits / building.totalUnits) * 100)
  const parkingOccupied = parkingSpots.filter((s) => s.status !== 'available').length
  const parkingOccupancyRate = Math.round((parkingOccupied / parkingSpots.length) * 100)
  const overtimeSpots = parkingSpots.filter((s) => s.status === 'overtime').length
  const unreadAlerts = alerts.filter((a) => !a.read).length
  const criticalAlerts = alerts.filter((a) => a.priority === 'critical' && !a.read).length

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ocupacion
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {building.occupiedUnits}/{building.totalUnits}
            </div>
            <Progress value={occupancyRate} className="mt-2 h-2" />
            <p className="mt-1 text-xs text-muted-foreground">{occupancyRate}% ocupado</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos del Mes
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(building.monthlyRevenue)}
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-success">
              <ArrowUpRight className="h-3 w-3" />
              +8% vs mes anterior
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cartera Pendiente
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {formatCurrency(building.outstandingBalance)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              3 residentes con mora
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alertas Activas
            </CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{unreadAlerts}</div>
            {criticalAlerts > 0 && (
              <Badge variant="destructive" className="mt-1">
                {criticalAlerts} criticas
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Parking Status */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Car className="h-5 w-5" />
              Estado de Parqueaderos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Visitantes Ocupados</span>
              <span className="font-medium text-foreground">
                {parkingOccupied}/{parkingSpots.length}
              </span>
            </div>
            <Progress value={parkingOccupancyRate} className="h-2" />
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="rounded-lg bg-success/10 p-3 text-center">
                <div className="text-2xl font-bold text-success">
                  {parkingSpots.filter((s) => s.status === 'available').length}
                </div>
                <p className="text-xs text-muted-foreground">Disponibles</p>
              </div>
              <div className="rounded-lg bg-destructive/10 p-3 text-center">
                <div className="text-2xl font-bold text-destructive">{overtimeSpots}</div>
                <p className="text-xs text-muted-foreground">En Tiempo Extra</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Visitors */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5" />
              Visitantes Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-foreground">{building.activeVisitors}</div>
              <p className="mt-1 text-sm text-muted-foreground">en el edificio ahora</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-lg bg-muted p-2">
                <div className="text-lg font-semibold text-foreground">5</div>
                <p className="text-xs text-muted-foreground">Vehiculos</p>
              </div>
              <div className="rounded-lg bg-muted p-2">
                <div className="text-lg font-semibold text-foreground">3</div>
                <p className="text-xs text-muted-foreground">Peatones</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Status */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <TrendingUp className="h-5 w-5" />
              Estado General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Suscripcion</span>
              <Badge className="bg-success/10 text-success">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Activa
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tasa de Cobro</span>
              <span className="font-medium text-foreground">94%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Satisfaccion</span>
              <span className="font-medium text-foreground">4.7/5</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Incidentes/mes</span>
              <span className="font-medium text-foreground">2</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
