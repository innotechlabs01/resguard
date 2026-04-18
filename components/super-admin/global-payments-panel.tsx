'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Download,
  Building2,
  ArrowUpRight,
  RefreshCw,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/lib/auth-context'
import type { Payment, BuildingStats } from '@/lib/types'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

const statusConfig = {
  succeeded: { icon: CheckCircle2, label: 'Exitoso', className: 'bg-success/10 text-success' },
  pending: { icon: Clock, label: 'Pendiente', className: 'bg-warning/10 text-warning' },
  failed: { icon: XCircle, label: 'Fallido', className: 'bg-destructive/10 text-destructive' },
  refunded: { icon: RefreshCw, label: 'Reembolsado', className: 'bg-info/10 text-info' },
}

const typeLabels = {
  subscription: 'Suscripcion',
  overtime_fee: 'Tiempo Extra',
  reservation: 'Reserva',
  fine: 'Multa',
}

interface BuildingDisplay {
  id: string
  name: string
  subscriptionStatus: string
}

export function GlobalPaymentsPanel() {
  const { user, isAuthenticated, isLoaded } = useAuth()
  const [search, setSearch] = useState('')
  const [payments, setPayments] = useState<any[]>([])
  const [buildings, setBuildings] = useState<BuildingDisplay[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    if (!isLoaded || !isAuthenticated) {
      setLoading(false)
      return
    }

    async function fetchData() {
      try {
        console.log('[GlobalPaymentsPanel] Fetching data...')
        
        const [buildingsRes, statsRes, paymentsRes] = await Promise.all([
          fetch('/api/buildings').then(r => r.json()).catch(e => {
            console.error('[GlobalPaymentsPanel] Buildings fetch error:', e)
            return []
          }),
          fetch('/api/stats').then(r => r.json()).catch(e => {
            console.error('[GlobalPaymentsPanel] Stats fetch error:', e)
            return { stats: null }
          }),
          fetch('/api/payments').then(r => r.json()).catch(e => {
            console.error('[GlobalPaymentsPanel] Payments fetch error:', e)
            return { payments: [] }
          }),
        ])

        console.log('[GlobalPaymentsPanel] Buildings response:', buildingsRes)
        console.log('[GlobalPaymentsPanel] Stats response:', statsRes)
        console.log('[GlobalPaymentsPanel] Payments response:', paymentsRes)

        // Handle buildings - API returns array directly
        const buildingsData = Array.isArray(buildingsRes) ? buildingsRes : (buildingsRes.buildings || [])
        setBuildings(buildingsData.map((b: any) => ({
          id: b.id,
          name: b.name,
          subscriptionStatus: b.subscriptionStatus || b.subscription_status || 'inactive',
        })))

        // Handle stats
        if (statsRes && statsRes.stats) {
          setStats(statsRes.stats)
        } else if (statsRes && !statsRes.error) {
          // Stats might be returned directly without wrapper
          setStats(statsRes)
        }

        // Handle payments
        if (paymentsRes && paymentsRes.payments) {
          setPayments(paymentsRes.payments)
        }
      } catch (error) {
        console.error('[GlobalPaymentsPanel] Error fetching payments data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isAuthenticated, isLoaded])

  const tabFilteredPayments = activeTab === 'all'
    ? payments
    : payments.filter(p => p.status === activeTab)

  const filteredPayments = tabFilteredPayments.filter(
    (p) =>
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      p.buildingName?.toLowerCase().includes(search.toLowerCase())
  )

  const totalSucceeded = payments
    .filter((p) => p.status === 'succeeded')
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  const totalPending = payments
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  const totalFailed = payments
    .filter((p) => p.status === 'failed')
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  const displayStats = stats
  const displayBuildings = buildings

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">{formatCurrency(totalSucceeded)}</div>
            {totalSucceeded > 0 && (
              <div className="flex items-center gap-1 text-xs text-success">
                <ArrowUpRight className="h-3 w-3" />
                Transacciones exitosas
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              MRR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {formatCurrency(displayStats.monthlyRecurringRevenue || displayStats.monthly_recurring_revenue || 0)}
            </div>
            <div className="flex items-center gap-1 text-xs text-success">
              <TrendingUp className="h-3 w-3" />
              {displayBuildings.filter((b) => b.subscriptionStatus === 'active').length} edificios activos
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pagos Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-warning">{formatCurrency(totalPending)}</div>
            <div className="text-xs text-muted-foreground">
              {payments.filter((p) => p.status === 'pending').length} transacciones
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pagos Fallidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totalFailed)}</div>
            <div className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="h-3 w-3" />
              Requieren atencion
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bold Collect Section */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <CreditCard className="h-5 w-5" />
            Bold Collect
          </CardTitle>
          <CardDescription>
            Gestion de pagos con Bold
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayBuildings.slice(0, 6).map((building) => (
              <div
                key={building.id}
                className="flex items-center gap-3 rounded-lg border border-border p-4"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{building.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {building.subscriptionStatus === 'active' ? 'Pagos activos' : 'Pendiente'}
                  </p>
                </div>
                <Badge className={building.subscriptionStatus === 'active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}>
                  {building.subscriptionStatus === 'active' ? 'Activo' : 'Pendiente'}
                </Badge>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.open('https://plataforma.bold.co/', '_blank')}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Panel de Pagos Bold
            </Button>
            <Button variant="outline" size="sm">
              Ver todas las cuentas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payments Tabs */}
      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="bg-muted">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="pending">Pendientes</TabsTrigger>
            <TabsTrigger value="succeeded">Exitosos</TabsTrigger>
            <TabsTrigger value="failed">Fallidos</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar pagos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-input border-border text-foreground"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        <TabsContent value="all" className="mt-4">
          <PaymentsTable payments={filteredPayments} />
        </TabsContent>
        <TabsContent value="subscriptions" className="mt-4">
          <PaymentsTable payments={filteredPayments.filter((p) => p.type === 'subscription')} />
        </TabsContent>
        <TabsContent value="fees" className="mt-4">
          <PaymentsTable payments={filteredPayments.filter((p) => p.type !== 'subscription')} />
        </TabsContent>
        <TabsContent value="failed" className="mt-4">
          <PaymentsTable payments={filteredPayments.filter((p) => p.status === 'failed')} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PaymentsTable({ payments }: { payments: Payment[] }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-muted/50">
              <TableHead className="text-muted-foreground whitespace-nowrap">Fecha</TableHead>
              <TableHead className="text-muted-foreground whitespace-nowrap">Edificio</TableHead>
              <TableHead className="text-muted-foreground whitespace-nowrap">Descripcion</TableHead>
              <TableHead className="text-muted-foreground whitespace-nowrap">Tipo</TableHead>
              <TableHead className="text-muted-foreground text-right whitespace-nowrap">Monto</TableHead>
              <TableHead className="text-muted-foreground whitespace-nowrap">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No se encontraron pagos en la base de datos
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => {
                const status = statusConfig[payment.status as keyof typeof statusConfig] || statusConfig.pending
                const StatusIcon = status.icon
                return (
                  <TableRow key={payment.id} className="border-border hover:bg-muted/50">
                    <TableCell className="text-foreground text-sm whitespace-nowrap">
                      {formatDate(payment.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{(payment as any).building_name || payment.buildingName || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground max-w-[150px] truncate">{(payment as any).descripcion || payment.description || 'Sin descripcion'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-border text-muted-foreground whitespace-nowrap">
                        <CreditCard className="mr-1 h-3 w-3" />
                        {typeLabels[payment.type as keyof typeof typeLabels] || payment.type || 'Otro'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-foreground whitespace-nowrap">
                      {formatCurrency((payment as any).monto || payment.amount || 0)}
                    </TableCell>
                    <TableCell>
                      <Badge className={status.className}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
