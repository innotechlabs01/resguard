'use client'

import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { SystemStats, BuildingStats } from '@/lib/types'

interface SuperAdminOverviewProps {
  systemStats: SystemStats
  buildings: BuildingStats[]
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    notation: 'compact',
  }).format(amount)
}

const statusColors = {
  active: 'bg-success/10 text-success',
  inactive: 'bg-muted text-muted-foreground',
  maintenance: 'bg-warning/10 text-warning',
}

const subscriptionColors = {
  active: 'bg-success/10 text-success',
  past_due: 'bg-destructive/10 text-destructive',
  canceled: 'bg-muted text-muted-foreground',
  trialing: 'bg-info/10 text-info',
}

export function SuperAdminOverview({ systemStats, buildings }: SuperAdminOverviewProps) {
  const activeRate = Math.round((systemStats.activeBuildings / systemStats.totalBuildings) * 100)

  return (
    <div className="space-y-6">
      {/* System Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Edificios Totales
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{systemStats.totalBuildings}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-success/10 text-success">{systemStats.activeBuildings} activos</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Residentes Totales
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{systemStats.totalResidents}</div>
            <div className="flex items-center gap-1 text-xs text-success mt-1">
              <ArrowUpRight className="h-3 w-3" />
              +23 este mes
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              MRR (Mensual)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(systemStats.monthlyRecurringRevenue)}
            </div>
            <div className="flex items-center gap-1 text-xs text-success mt-1">
              <TrendingUp className="h-3 w-3" />
              +15% vs mes anterior
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pagos Pendientes
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {formatCurrency(systemStats.pendingPayments)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Requiere seguimiento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Buildings Overview */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Resumen de Edificios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {buildings.map((building) => (
              <div
                key={building.id}
                className="flex items-center gap-4 rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground truncate">{building.name}</h3>
                    <Badge className={statusColors[building.status]}>
                      {building.status === 'active' ? 'Activo' : 
                       building.status === 'maintenance' ? 'Mantenimiento' : 'Inactivo'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{building.address}</p>
                </div>

                <div className="hidden md:flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-medium text-foreground">{building.occupiedUnits}/{building.totalUnits}</p>
                    <p className="text-xs text-muted-foreground">Unidades</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-foreground">{building.activeVisitors}</p>
                    <p className="text-xs text-muted-foreground">Visitantes</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-foreground">{formatCurrency(building.monthlyRevenue)}</p>
                    <p className="text-xs text-muted-foreground">Ingresos/mes</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <Badge className={subscriptionColors[building.subscriptionStatus]}>
                    {building.subscriptionStatus === 'active' && (
                      <><CheckCircle2 className="mr-1 h-3 w-3" />Al dia</>
                    )}
                    {building.subscriptionStatus === 'past_due' && (
                      <><XCircle className="mr-1 h-3 w-3" />Vencido</>
                    )}
                    {building.subscriptionStatus === 'trialing' && 'Prueba'}
                    {building.subscriptionStatus === 'canceled' && 'Cancelado'}
                  </Badge>
                  {building.outstandingBalance > 0 && (
                    <span className="text-xs text-destructive">
                      Deuda: {formatCurrency(building.outstandingBalance)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tasa de Activacion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{activeRate}%</div>
            <Progress value={activeRate} className="mt-2 h-2" />
            <p className="mt-2 text-xs text-muted-foreground">
              {systemStats.activeBuildings} de {systemStats.totalBuildings} edificios activos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alertas del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{systemStats.systemAlerts}</div>
            <div className="mt-2 flex gap-2">
              <Badge variant="destructive">3 criticas</Badge>
              <Badge className="bg-warning/10 text-warning">5 medias</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Crecimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold text-success">+15%</div>
              <ArrowUpRight className="h-6 w-6 text-success" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Comparado con el mes anterior
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
