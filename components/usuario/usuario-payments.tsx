'use client'

import { useState, useEffect } from 'react'
import {
  Receipt,
  Download,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BoldPaymentButton } from '@/components/ui/bold-payment-button'
import { useAuth } from '@/lib/auth-context'

interface PaymentRecord {
  id: string
  concept: string
  amount: number
  date: Date
  status: 'paid' | 'pending' | 'overdue'
  dueDate?: Date
  boldLinkId?: string
  buildingId?: string
}

const statusConfig = {
  paid: { label: 'Pagado', icon: CheckCircle, color: 'text-success bg-success/10' },
  pending: { label: 'Pendiente', icon: Clock, color: 'text-warning bg-warning/10' },
  overdue: { label: 'Vencido', icon: AlertCircle, color: 'text-destructive bg-destructive/10' },
}

export function UsuarioPayments() {
  const { user } = useAuth()
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null)

  useEffect(() => {
    if (user?.buildingId) {
      fetch(`/api/payments?buildingId=${user.buildingId}`)
        .then(res => res.json())
        .then(data => {
          if (data.payments) {
            const formatted = data.payments
              .filter((p: any) => p.status !== 'succeeded')
              .map((p: any) => ({
                id: p.id,
                concept: p.description,
                amount: p.amount,
                date: new Date(p.createdAt),
                status: p.status === 'succeeded' ? 'paid' : p.status === 'pending' ? 'pending' : 'overdue',
                boldLinkId: p.boldLinkId,
                buildingId: p.buildingId,
              }))
            setPayments(formatted)
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [user])

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

  const pendingPayments = payments.filter((p) => p.status === 'pending' || p.status === 'overdue')
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0)
  const totalPaid = payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)

  const handlePayClick = (payment: PaymentRecord) => {
    setSelectedPayment(payment)
    setShowPaymentDialog(true)
  }

  const handlePaymentSuccess = () => {
    if (selectedPayment) {
      setPayments(prev => prev.map(p => 
        p.id === selectedPayment.id ? { ...p, status: 'paid' as const } : p
      ))
    }
    setShowPaymentDialog(false)
    setSelectedPayment(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

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
            <p className="text-xs text-muted-foreground">Vence: 1 Abr 2026</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pagado 2026
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(totalPaid)}</div>
            <p className="text-xs text-muted-foreground">{payments.filter(p => p.status === 'paid').length} cuota(s) este ano</p>
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
            {pendingPayments[0] && (
              <Button 
                className="gap-2" 
                onClick={() => handlePayClick(pendingPayments[0])}
              >
                <CreditCard className="h-4 w-4" />
                Pagar Ahora
              </Button>
            )}
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
          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p>No tienes pagos registrados</p>
            </div>
          ) : (
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
                {payments.map((payment) => {
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
                          <Button 
                            size="sm" 
                            className="gap-1"
                            onClick={() => handlePayClick(payment)}
                          >
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
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog with Bold Button */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Realizar Pago</DialogTitle>
          </DialogHeader>
          
          {selectedPayment && (
            <BoldPaymentButton
              paymentId={selectedPayment.id}
              amount={selectedPayment.amount}
              description={selectedPayment.concept}
              onSuccess={handlePaymentSuccess}
              onError={(error) => console.error('Payment error:', error)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}