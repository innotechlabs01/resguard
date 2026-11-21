'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Smartphone,
  Globe,
  AlertTriangle,
  ShieldAlert,
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import type { BuildingStats, SystemStats } from '@/lib/types'

export interface AdminTenantMetric {
  adminId: string
  adminName: string
  adminEmail: string
  organizationId: string | null
  organizationName: string
  tenantType: 'hogar' | 'grupo' | 'comunidad' | 'inmobiliaria' | 'legacy'
  buildingCount: number
  totalResidents: number
  monthlyRevenue: number
  outstandingBalance: number
  subscriptionStatus: string
  buildingNames: string[]
}

export interface PlatformHealth {
  totalActiveDevices: number
  devicesByType: {
    ios: number
    android: number
    web: number
    unknown: number
    raw: Record<string, number>
  }
  mobileDevices: number
  webDevices: number
  recentAlertsCount: number
  unreadHighAlertsCount: number
  recentAuditErrorsCount: number
  lastUpdated: string
}

interface ApiPayment {
  id: string
  buildingId: string
  amount: number
  status: 'succeeded' | 'pending' | 'failed' | 'refunded'
  createdAt: string
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    notation: 'compact',
  }).format(amount)
}

const tenantTypeLabels: Record<AdminTenantMetric['tenantType'], { label: string; className: string }> = {
  hogar: { label: 'Hogar', className: 'bg-blue-500/10 text-blue-500' },
  grupo: { label: 'Grupo', className: 'bg-purple-500/10 text-purple-500' },
  comunidad: { label: 'Comunidad', className: 'bg-emerald-500/10 text-emerald-500' },
  inmobiliaria: { label: 'Inmobiliaria', className: 'bg-amber-500/10 text-amber-500' },
  legacy: { label: 'Legacy', className: 'bg-muted text-muted-foreground' },
}

const subscriptionBadgeConfig: Record<string, { label: string; className: string }> = {
  active: { label: 'Al día', className: 'bg-success/10 text-success' },
  trialing: { label: 'Prueba', className: 'bg-info/10 text-info' },
  grace_period: { label: 'Gracia', className: 'bg-warning/10 text-warning' },
  past_due: { label: 'Vencido', className: 'bg-destructive/10 text-destructive' },
  blocked: { label: 'Bloqueado', className: 'bg-destructive/10 text-destructive' },
  suspended: { label: 'Suspendido', className: 'bg-warning/10 text-warning' },
  canceled: { label: 'Cancelado', className: 'bg-muted text-muted-foreground' },
}

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

interface AnalyticsPanelProps {
  buildings: BuildingStats[]
  systemStats: SystemStats | null
  adminMetrics?: AdminTenantMetric[]
  platformHealth?: PlatformHealth | null
}

export function AnalyticsPanel({
  buildings,
  systemStats,
  adminMetrics = [],
  platformHealth = null,
}: AnalyticsPanelProps) {
  const [payments, setPayments] = useState<ApiPayment[]>([])
  const [loadingPayments, setLoadingPayments] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchPayments() {
      try {
        const res = await fetch('/api/payments', { cache: 'no-store' })
        if (!cancelled && res.ok) {
          const data = await res.json()
          setPayments(Array.isArray(data.payments) ? data.payments : [])
        }
      } catch {
        // Keep empty payments array on network error
      } finally {
        if (!cancelled) setLoadingPayments(false)
      }
    }
    fetchPayments()
    return () => { cancelled = true }
  }, [])

  const totalRevenue = buildings.reduce((sum, b) => sum + b.monthlyRevenue, 0)
  const totalUnits = buildings.reduce((sum, b) => sum + b.totalUnits, 0)
  const occupiedUnits = buildings.reduce((sum, b) => sum + b.occupiedUnits, 0)
  const activeBuildingsCount = buildings.filter(b => b.status === 'active').length

  const avgOccupancy = buildings.length > 0
    ? Math.round(
        buildings.reduce((sum, b) => sum + (b.totalUnits > 0 ? (b.occupiedUnits / b.totalUnits) * 100 : 0), 0) / buildings.length
      )
    : 0

  // Real collection rate from /api/payments
  const { collectionRate, succeededPaymentsCount, totalBilledCount, collectedTotal } = useMemo(() => {
    const relevant = payments.filter(p => p.status !== 'refunded')
    const succeeded = relevant.filter(p => p.status === 'succeeded')
    const rate = relevant.length > 0 ? Math.round((succeeded.length / relevant.length) * 100) : 0
    const collected = succeeded.reduce((sum, p) => sum + Number(p.amount || 0), 0)
    return {
      collectionRate: rate,
      succeededPaymentsCount: succeeded.length,
      totalBilledCount: relevant.length,
      collectedTotal: collected,
    }
  }, [payments])

  // Real 6-month revenue trend from succeeded payments
  const monthlyRevenueTrend = useMemo(() => {
    const now = new Date()
    const buckets: Array<{ key: string; month: string; revenue: number }> = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      buckets.push({
        key,
        month: MONTH_NAMES[d.getMonth()],
        revenue: 0,
      })
    }

    const bucketMap = new Map(buckets.map(b => [b.key, b]))
    for (const p of payments) {
      if (p.status !== 'succeeded') continue
      const d = new Date(p.createdAt)
      if (Number.isNaN(d.getTime())) continue
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const bucket = bucketMap.get(key)
      if (bucket) {
        bucket.revenue += Number(p.amount || 0)
      }
    }

    return buckets.map(({ month, revenue }) => ({ month, revenue }))
  }, [payments])

  const buildingRevenueData = buildings.map((b) => ({
    name: b.name.split(' ')[0],
    revenue: b.monthlyRevenue / 1000000,
    units: b.totalUnits,
  }))

  const occupancyData = [
    { name: 'Ocupado', value: occupiedUnits, color: '#22c55e' },
    { name: 'Disponible', value: Math.max(0, totalUnits - occupiedUnits), color: '#3b82f6' },
  ]

  const totalDevices = platformHealth?.totalActiveDevices || 0
  const mobilePct = totalDevices > 0 ? Math.round(((platformHealth?.mobileDevices || 0) / totalDevices) * 100) : 0
  const webPct = totalDevices > 0 ? Math.round(((platformHealth?.webDevices || 0) / totalDevices) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              MRR Edificios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {buildings.length} {buildings.length === 1 ? 'edificio registrado' : 'edificios registrados'}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ocupación Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{avgOccupancy}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {occupiedUnits} / {totalUnits} unidades ocupadas
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Residentes Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{systemStats?.totalResidents || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeBuildingsCount} edificios activos
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tasa de Cobro Real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {loadingPayments ? '...' : `${collectionRate}%`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {loadingPayments
                ? 'Cargando pagos...'
                : totalBilledCount > 0
                  ? `${succeededPaymentsCount}/${totalBilledCount} pagos · ${formatCurrency(collectedTotal)}`
                  : 'Sin pagos registrados'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Ingresos Mensuales Cobrados</CardTitle>
            <CardDescription className="text-muted-foreground">
              Pagos exitosos de los últimos 6 meses (COP)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyRevenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.01 250)" />
                <XAxis dataKey="month" stroke="oklch(0.65 0.02 250)" />
                <YAxis stroke="oklch(0.65 0.02 250)" />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Recaudado']}
                  contentStyle={{
                    backgroundColor: 'oklch(0.16 0.01 250)',
                    border: '1px solid oklch(0.28 0.02 250)',
                    borderRadius: '8px',
                    color: 'oklch(0.95 0.01 250)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="oklch(0.65 0.18 175)"
                  strokeWidth={2}
                  dot={{ fill: 'oklch(0.65 0.18 175)', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Building */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Ingresos por Edificio (Millones COP)</CardTitle>
            <CardDescription className="text-muted-foreground">
              Tarifa mensual configurada por copropiedad
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={buildingRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.01 250)" />
                <XAxis dataKey="name" stroke="oklch(0.65 0.02 250)" />
                <YAxis stroke="oklch(0.65 0.02 250)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'oklch(0.16 0.01 250)',
                    border: '1px solid oklch(0.28 0.02 250)',
                    borderRadius: '8px',
                    color: 'oklch(0.95 0.01 250)',
                  }}
                />
                <Bar dataKey="revenue" fill="oklch(0.65 0.18 175)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Occupancy & Building Performance */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Occupancy Pie */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Ocupación General</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={occupancyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {occupancyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex justify-center gap-4">
              {occupancyData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-muted-foreground">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Building Performance Table */}
        <Card className="bg-card border-border md:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground">Rendimiento por Edificio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {buildings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay edificios registrados.</p>
              ) : (
                buildings.map((building) => {
                  const occupancy = building.totalUnits > 0
                    ? Math.round((building.occupiedUnits / building.totalUnits) * 100)
                    : 0
                  return (
                    <div key={building.id} className="flex items-center gap-4">
                      <div className="w-32 truncate text-sm text-foreground">{building.name}</div>
                      <div className="flex-1">
                        <div className="flex h-4 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="bg-primary transition-all"
                            style={{ width: `${occupancy}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-12 text-right text-sm font-medium text-foreground">{occupancy}%</div>
                      <div className="w-20 text-right text-sm text-muted-foreground">
                        {formatCurrency(building.monthlyRevenue)}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rendimiento por Administrador y Tenants */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Building2 className="h-5 w-5 text-primary" />
            Rendimiento por Administrador y Tenants
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Desglose de edificios, hogares, residentes e ingresos agrupados por administrador y organización
          </CardDescription>
        </CardHeader>
        <CardContent>
          {adminMetrics.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No hay métricas de administradores disponibles todavía.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Administrador</TableHead>
                    <TableHead>Organización / Tenant</TableHead>
                    <TableHead className="text-center">Edificios</TableHead>
                    <TableHead className="text-center">Residentes</TableHead>
                    <TableHead className="text-right">Ingresos / Mes</TableHead>
                    <TableHead className="text-right">Saldo Pendiente</TableHead>
                    <TableHead className="text-right">Suscripción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminMetrics.map((metric) => {
                    const typeCfg = tenantTypeLabels[metric.tenantType] || tenantTypeLabels.legacy
                    const subCfg = subscriptionBadgeConfig[metric.subscriptionStatus] || {
                      label: metric.subscriptionStatus,
                      className: 'bg-muted text-muted-foreground',
                    }
                    return (
                      <TableRow key={`${metric.adminId}-${metric.organizationId || 'legacy'}`}>
                        <TableCell>
                          <div className="font-medium text-foreground">{metric.adminName}</div>
                          <div className="text-xs text-muted-foreground">{metric.adminEmail}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-foreground">{metric.organizationName}</span>
                            <Badge className={typeCfg.className}>{typeCfg.label}</Badge>
                          </div>
                          {metric.buildingNames.length > 0 && (
                            <div className="text-xs text-muted-foreground truncate max-w-[240px]" title={metric.buildingNames.join(', ')}>
                              {metric.buildingNames.join(', ')}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-medium">{metric.buildingCount}</TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 text-sm">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            {metric.totalResidents}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium text-foreground">
                          {formatCurrency(metric.monthlyRevenue)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={metric.outstandingBalance > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                            {formatCurrency(metric.outstandingBalance)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className={subCfg.className}>
                            {metric.subscriptionStatus === 'active' && <CheckCircle2 className="mr-1 h-3 w-3" />}
                            {(metric.subscriptionStatus === 'past_due' || metric.subscriptionStatus === 'blocked') && (
                              <XCircle className="mr-1 h-3 w-3" />
                            )}
                            {metric.subscriptionStatus === 'grace_period' && <Clock className="mr-1 h-3 w-3" />}
                            {subCfg.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Salud Mobile & PWA */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Smartphone className="h-5 w-5 text-primary" />
            Salud Mobile &amp; PWA
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Adopción real de dispositivos activos (device_tokens) y telemetría de alertas/fallas recientes (últimos 7 días)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Platform adoption */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Dispositivos Activos Totales</span>
                <span className="text-2xl font-bold text-foreground">{totalDevices}</span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Smartphone className="h-4 w-4 text-primary" />
                      Mobile (iOS: {platformHealth?.devicesByType.ios || 0} · Android: {platformHealth?.devicesByType.android || 0})
                    </span>
                    <span className="font-medium text-foreground">
                      {platformHealth?.mobileDevices || 0} ({mobilePct}%)
                    </span>
                  </div>
                  <Progress value={mobilePct} className="h-2" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="h-4 w-4 text-info" />
                      Web / PWA
                    </span>
                    <span className="font-medium text-foreground">
                      {platformHealth?.webDevices || 0} ({webPct}%)
                    </span>
                  </div>
                  <Progress value={webPct} className="h-2" />
                </div>

                {(platformHealth?.devicesByType.unknown || 0) > 0 && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <span>Otros / Sin especificar</span>
                    <span>{platformHealth?.devicesByType.unknown}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Alerts & Errors */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Alertas (7d)
                </div>
                <div className="mt-2 text-2xl font-bold text-foreground">
                  {platformHealth?.recentAlertsCount || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Registradas</p>
              </div>

              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <ShieldAlert className="h-4 w-4 text-destructive" />
                  Críticas sin leer
                </div>
                <div className="mt-2 text-2xl font-bold text-destructive">
                  {platformHealth?.unreadHighAlertsCount || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Alta prioridad</p>
              </div>

              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                  Fallas Audit (7d)
                </div>
                <div className="mt-2 text-2xl font-bold text-foreground">
                  {platformHealth?.recentAuditErrorsCount || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Eventos de error</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
