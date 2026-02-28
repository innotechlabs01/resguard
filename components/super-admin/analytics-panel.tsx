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
import { mockBuildingStats, mockSystemStats } from '@/lib/mock-data'
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

const buildingRevenueData = mockBuildingStats.map((b) => ({
  name: b.name.split(' ')[0],
  revenue: b.monthlyRevenue / 1000000,
  units: b.totalUnits,
}))

const occupancyData = [
  { name: 'Ocupado', value: mockBuildingStats.reduce((sum, b) => sum + b.occupiedUnits, 0), color: '#22c55e' },
  { name: 'Disponible', value: mockBuildingStats.reduce((sum, b) => sum + (b.totalUnits - b.occupiedUnits), 0), color: '#3b82f6' },
]

export function AnalyticsPanel() {
  const totalRevenue = mockBuildingStats.reduce((sum, b) => sum + b.monthlyRevenue, 0)
  const avgOccupancy = Math.round(
    mockBuildingStats.reduce((sum, b) => sum + (b.occupiedUnits / b.totalUnits) * 100, 0) / mockBuildingStats.length
  )

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
            <div className="text-2xl font-bold text-foreground">{mockSystemStats.totalResidents}</div>
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

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Trend */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <TrendingUp className="h-5 w-5" />
              Tendencia de Ingresos
            </CardTitle>
            <CardDescription>Ultimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickFormatter={(value) => `${value / 1000000}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [formatCurrency(value), 'Ingresos']}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Building */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Building2 className="h-5 w-5" />
              Ingresos por Edificio
            </CardTitle>
            <CardDescription>Comparativa mensual (en millones COP)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={buildingRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [`${value}M COP`, 'Ingresos']}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Occupancy Chart */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5" />
              Ocupacion Global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
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
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex justify-center gap-4">
              {occupancyData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm text-muted-foreground">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Building Performance */}
        <Card className="bg-card border-border col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground">Rendimiento por Edificio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockBuildingStats.map((building) => {
                const occupancy = Math.round((building.occupiedUnits / building.totalUnits) * 100)
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
