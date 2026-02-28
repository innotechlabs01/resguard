'use client'

import { useState } from 'react'
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
import type { Payment } from '@/lib/types'
import { mockPayments, mockBuildingStats, mockSystemStats } from '@/lib/mock-data'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
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

export function GlobalPaymentsPanel() {
  const [search, setSearch] = useState('')
  const [payments] = useState<Payment[]>(mockPayments)

  const filteredPayments = payments.filter(
    (p) =>
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.buildingName.toLowerCase().includes(search.toLowerCase())
  )

  const totalSucceeded = payments
    .filter((p) => p.status === 'succeeded')
    .reduce((sum, p) => sum + p.amount, 0)

  const totalPending = payments
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0)

  const totalFailed = payments
    .filter((p) => p.status === 'failed')
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(totalSucceeded)}</div>
            <div className="flex items-center gap-1 text-xs text-success">
              <ArrowUpRight className="h-3 w-3" />
              +15% vs mes anterior
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              MRR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(mockSystemStats.monthlyRecurringRevenue)}
            </div>
            <div className="flex items-center gap-1 text-xs text-success">
              <TrendingUp className="h-3 w-3" />
              5 edificios activos
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
            <div className="text-2xl font-bold text-warning">{formatCurrency(totalPending)}</div>
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

      {/* Stripe Connect Section */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <CreditCard className="h-5 w-5" />
            Stripe Connect
          </CardTitle>
          <CardDescription>
            Gestion de cuentas conectadas y pagos divididos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockBuildingStats.slice(0, 3).map((building) => (
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
                    {building.subscriptionStatus === 'active' ? 'Cuenta conectada' : 'Pendiente'}
                  </p>
                </div>
                <Badge className={building.subscriptionStatus === 'active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}>
                  {building.subscriptionStatus === 'active' ? 'Activo' : 'Pendiente'}
                </Badge>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir Stripe Dashboard
            </Button>
            <Button variant="outline" size="sm">
              Ver todas las cuentas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payments Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="bg-muted">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="subscriptions">Suscripciones</TabsTrigger>
            <TabsTrigger value="fees">Cargos</TabsTrigger>
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
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-muted/50">
              <TableHead className="text-muted-foreground">Fecha</TableHead>
              <TableHead className="text-muted-foreground">Edificio</TableHead>
              <TableHead className="text-muted-foreground">Descripcion</TableHead>
              <TableHead className="text-muted-foreground">Tipo</TableHead>
              <TableHead className="text-muted-foreground text-right">Monto</TableHead>
              <TableHead className="text-muted-foreground">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No se encontraron pagos
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => {
                const status = statusConfig[payment.status]
                const StatusIcon = status.icon
                return (
                  <TableRow key={payment.id} className="border-border hover:bg-muted/50">
                    <TableCell className="text-foreground text-sm">
                      {formatDate(payment.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{payment.buildingName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">{payment.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-border text-muted-foreground">
                        <CreditCard className="mr-1 h-3 w-3" />
                        {typeLabels[payment.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-foreground">
                      {formatCurrency(payment.amount)}
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
