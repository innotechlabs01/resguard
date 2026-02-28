'use client'

import {
  Receipt,
  Download,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

interface PaymentRecord {
  id: string
  concept: string
  amount: number
  date: Date
  status: 'paid' | 'pending' | 'overdue'
  dueDate?: Date
}

const mockPaymentHistory: PaymentRecord[] = [
  {
    id: '1',
    concept: 'Cuota Administracion - Febrero 2026',
    amount: 450000,
    date: new Date(),
    status: 'pending',
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    concept: 'Cuota Administracion - Enero 2026',
    amount: 450000,
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    status: 'paid',
  },
  {
    id: '3',
    concept: 'Cargo Parqueadero Extra',
    amount: 15000,
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    status: 'paid',
  },
  {
    id: '4',
    concept: 'Cuota Administracion - Diciembre 2025',
    amount: 450000,
    date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    status: 'paid',
  },
  {
    id: '5',
    concept: 'Reserva Salon Social',
    amount: 200000,
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    status: 'paid',
  },
]

const statusConfig = {
  paid: { label: 'Pagado', icon: CheckCircle, color: 'text-success bg-success/10' },
  pending: { label: 'Pendiente', icon: Clock, color: 'text-warning bg-warning/10' },
  overdue: { label: 'Vencido', icon: AlertCircle, color: 'text-destructive bg-destructive/10' },
}

export function UsuarioPayments() {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date)
  }

  const pendingPayments = mockPaymentHistory.filter((p) => p.status === 'pending' || p.status === 'overdue')
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Pagos y Estado de Cuenta</h2>
        <p className="text-muted-foreground">Consulta y realiza tus pagos de administracion</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalPending > 0 ? 'text-warning' : 'text-success'}`}>
              {formatCurrency(totalPending)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalPending > 0 ? 'Por pagar' : 'Al dia'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Proxima Cuota
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(450000)}</div>
            <p className="text-xs text-muted-foreground">Vence: 1 Mar 2026</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pagado 2026
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(450000)}</div>
            <p className="text-xs text-muted-foreground">1 cuota este ano</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Payments Alert */}
      {totalPending > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="flex items-center justify-between pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
                <Receipt className="h-6 w-6 text-warning" />
              </div>
              <div>
                <h4 className="font-medium text-foreground">Tienes pagos pendientes</h4>
                <p className="text-sm text-muted-foreground">
                  Total por pagar: {formatCurrency(totalPending)}
                </p>
              </div>
            </div>
            <Button className="gap-2">
              <CreditCard className="h-4 w-4" />
              Pagar Ahora
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Historial de Pagos</CardTitle>
          <CardDescription>Todos tus movimientos y recibos</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-muted-foreground">Concepto</TableHead>
                <TableHead className="text-muted-foreground">Fecha</TableHead>
                <TableHead className="text-muted-foreground">Monto</TableHead>
                <TableHead className="text-muted-foreground">Estado</TableHead>
                <TableHead className="text-right text-muted-foreground">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPaymentHistory.map((payment) => {
                const status = statusConfig[payment.status]
                const StatusIcon = status.icon

                return (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium text-foreground">
                      {payment.concept}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(payment.date)}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge className={status.color}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {payment.status === 'paid' ? (
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Download className="h-4 w-4" />
                          Recibo
                        </Button>
                      ) : (
                        <Button size="sm" className="gap-1">
                          <CreditCard className="h-4 w-4" />
                          Pagar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
