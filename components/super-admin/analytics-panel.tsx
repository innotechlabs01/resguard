'use client'

import {
  TrendingUp,
  Users,
  Building2,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    notation: 'compact',
  }).format(amount)
}

const revenueData = [
  { month: 'Ago', revenue: 150000000 },
  { month: 'Sep', revenue: 160000000 },
  { month: 'Oct', revenue: 172000000 },
  { month: 'Nov', revenue: 180000000 },
  { month: 'Dic', revenue: 188000000 },
  { month: 'Ene', revenue: 192000000 },
]

interface AnalyticsPanelProps {
  buildings: BuildingStats[]
  systemStats: SystemStats | null
}

export function AnalyticsPanel({ buildings, systemStats }: AnalyticsPanelProps) {
  const totalRevenue = buildings.reduce((sum, b) => sum + b.monthlyRevenue, 0)
  const avgOccupancy = buildings.length > 0
    ? Math.round(
        buildings.reduce((sum, b) => sum + (b.totalUnits > 0 ? (b.occupiedUnits / b.totalUnits) * 100 : 0), 0) / buildings.length
      )
    : 0

  const buildingRevenueData = buildings.map((b) => ({
    name: b.name.split(' ')[0],
    revenue: b.monthlyRevenue / 1000000,
    units: b.totalUnits,
  }))

  const occupancyData = [
    { name: 'Ocupado', value: buildings.reduce((sum, b) => sum + b.occupiedUnits, 0), color: '#22c55e' },
    { name: 'Disponible', value: buildings.reduce((sum, b) => sum + (b.totalUnits - b.occupiedUnits), 0), color: '#3b82f6' },
  ]

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(totalRevenue)}</div>
            <div className="flex items-center gap-1 text-xs text-success">
              <ArrowUpRight className="h-3 w-3" />
              +15% vs mes anterior
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ocupacion Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{avgOccupancy}%</div>
            <div className="flex items-center gap-1 text-xs text-success">
              <ArrowUpRight className="h-3 w-3" />
              +2% vs mes anterior
            </div>
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
            <div className="flex items-center gap-1 text-xs text-success">
              <ArrowUpRight className="h-3 w-3" />
              +23 este mes
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tasa de Cobro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">94%</div>
            <div className="flex items-center gap-1 text-xs text-destructive">
              <ArrowDownRight className="h-3 w-3" />
              -1% vs mes anterior
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Ingresos Mensuales</CardTitle>
            <CardDescription className="text-muted-foreground">Tendencia de ingresos de los ultimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.01 250)" />
                <XAxis dataKey="month" stroke="oklch(0.65 0.02 250)" />
                <YAxis stroke="oklch(0.65 0.02 250)" />
                <Tooltip
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
            <CardTitle className="text-foreground">Ocupacion General</CardTitle>
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
        <Card className="bg-card border-border col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground">Rendimiento por Edificio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {buildings.map((building) => {
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
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
