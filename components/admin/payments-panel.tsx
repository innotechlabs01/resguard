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
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Link,
  Copy,
  ExternalLink,
  Send,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { Payment } from '@/lib/types'
import { mockPayments } from '@/lib/mock-data'
import { useAuth } from '@/lib/auth-context'

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
  refunded: { icon: ArrowDownRight, label: 'Reembolsado', className: 'bg-info/10 text-info' },
}

const typeLabels = {
  subscription: 'Cuota Admin.',
  overtime_fee: 'Tiempo Extra',
  reservation: 'Reserva',
  fine: 'Multa',
}

interface PaymentLink {
  boldLinkId: string
  url: string
  paymentId: string
}

export function PaymentsPanel({ payments: propPayments }: { payments?: Payment[] } = {}) {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [dbPayments, setDbPayments] = useState<any[]>([])
  const [loadingDb, setLoadingDb] = useState(false)
  const [payments, setPayments] = useState<Payment[]>(propPayments || mockPayments)
  const [showNewPayment, setShowNewPayment] = useState(false)
  const [showSendLinkDialog, setShowSendLinkDialog] = useState(false)
  const [selectedPaymentForLink, setSelectedPaymentForLink] = useState<any>(null)
  const [sendingLink, setSendingLink] = useState(false)
  const [createdLink, setCreatedLink] = useState<PaymentLink | null>(null)
  const [newPayment, setNewPayment] = useState({
    description: '',
    amount: '',
    type: 'subscription' as Payment['type'],
    residentUnit: '',
    amountType: 'CLOSE' as 'OPEN' | 'CLOSE',
    sendLink: true,
    residentEmail: '',
  })

  const allPayments = propPayments || (dbPayments.length > 0 ? dbPayments : payments)

  useState(() => {
    if (user?.buildingId && !propPayments) {
      setLoadingDb(true)
      fetch(`/api/payments?buildingId=${user.buildingId}`)
        .then(res => res.json())
        .then(data => {
          if (data.payments) {
            setDbPayments(data.payments)
          }
        })
        .catch(console.error)
        .finally(() => setLoadingDb(false))
    }
  })

  const buildingPayments = allPayments.filter(
    (p) => p.buildingId === user?.buildingId || p.buildingId === 'building-1'
  )

  const handleAddPayment = () => {
    if (!newPayment.description || !newPayment.amount || !newPayment.residentUnit) return
    
    const payment: Payment = {
      id: Math.random().toString(36).slice(2),
      buildingId: 'building-1',
      buildingName: 'Torres del Parque',
      amount: parseInt(newPayment.amount),
      currency: 'COP',
      status: 'pending',
      type: newPayment.type,
      description: newPayment.description,
      residentUnit: newPayment.residentUnit,
      createdAt: new Date(),
    }
    
    setPayments([payment, ...payments])
    setNewPayment({ description: '', amount: '', type: 'subscription', residentUnit: '', amountType: 'CLOSE', sendLink: true, residentEmail: '' })
    setShowNewPayment(false)
  }

  const handleCreatePaymentLink = async () => {
    if (!newPayment.description || !newPayment.residentUnit || !user?.buildingId) return
    
    setSendingLink(true)
    try {
      const response = await fetch('/api/payments/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: newPayment.amountType === 'CLOSE' ? parseInt(newPayment.amount) || 0 : 0,
          amountType: newPayment.amountType,
          description: newPayment.description,
          residentUnit: newPayment.residentUnit,
          residentEmail: newPayment.residentEmail || undefined,
          buildingId: user.buildingId,
          buildingName: user.buildingId,
          paymentType: newPayment.type,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setCreatedLink({
          boldLinkId: data.boldLinkId,
          url: data.url,
          paymentId: data.paymentId,
        })
        
        setDbPayments(prev => [{
          id: data.paymentId,
          buildingId: user.buildingId,
          buildingName: user.buildingId || 'Edificio',
          amount: parseInt(newPayment.amount) || 0,
          currency: 'COP',
          status: 'pending',
          type: newPayment.type,
          description: newPayment.description,
          residentUnit: newPayment.residentUnit,
          createdAt: new Date().toISOString(),
          boldLinkId: data.boldLinkId,
          boldUrl: data.url,
          amountType: newPayment.amountType,
        }, ...prev])
      }
    } catch (error) {
      console.error('Error creating payment link:', error)
    } finally {
      setSendingLink(false)
    }
  }

  const copyLinkToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
  }

  const filteredPayments = buildingPayments.filter(
    (p) =>
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.residentUnit?.toLowerCase().includes(search.toLowerCase())
  )

  const totalSucceeded = buildingPayments
    .filter((p) => p.status === 'succeeded')
    .reduce((sum, p) => sum + p.amount, 0)

  const totalPending = buildingPayments
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos del Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(totalSucceeded)}</div>
            <div className="flex items-center gap-1 text-xs text-success">
              <ArrowUpRight className="h-3 w-3" />
              +12% vs mes anterior
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
              {buildingPayments.filter((p) => p.status === 'pending').length} transacciones
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
            <div className="flex items-center gap-1 text-xs text-success">
              <TrendingUp className="h-3 w-3" />
              Meta: 95%
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
            <div className="text-2xl font-bold text-destructive">
              {buildingPayments.filter((p) => p.status === 'failed').length}
            </div>
            <div className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="h-3 w-3" />
              Requieren atencion
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
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
            <Button size="sm" onClick={() => setShowNewPayment(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cobro
            </Button>
          </div>
        </div>

        <TabsContent value="all" className="mt-4">
          <PaymentsTable payments={filteredPayments} />
        </TabsContent>
        <TabsContent value="pending" className="mt-4">
          <PaymentsTable payments={filteredPayments.filter((p) => p.status === 'pending')} />
        </TabsContent>
        <TabsContent value="succeeded" className="mt-4">
          <PaymentsTable payments={filteredPayments.filter((p) => p.status === 'succeeded')} />
        </TabsContent>
        <TabsContent value="failed" className="mt-4">
          <PaymentsTable payments={filteredPayments.filter((p) => p.status === 'failed')} />
        </TabsContent>
      </Tabs>

      <Dialog open={showNewPayment} onOpenChange={setShowNewPayment}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Nuevo Cobro</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Registra un nuevo cobro para un residente
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paymentType">Tipo de cobro</Label>
              <Select 
                value={newPayment.type} 
                onValueChange={(v) => setNewPayment({ ...newPayment, type: v as Payment['type'] })}
              >
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subscription">Cuota Administracion</SelectItem>
                  <SelectItem value="overtime_fee">Tiempo Extra Parqueadero</SelectItem>
                  <SelectItem value="reservation">Reserva Area Comunal</SelectItem>
                  <SelectItem value="fine">Multa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="residentUnit">Unidad</Label>
              <Input
                id="residentUnit"
                value={newPayment.residentUnit}
                onChange={(e) => setNewPayment({ ...newPayment, residentUnit: e.target.value })}
                placeholder="101"
                className="bg-input border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="residentEmail">Correo del residente (opcional)</Label>
              <Input
                id="residentEmail"
                type="email"
                value={newPayment.residentEmail}
                onChange={(e) => setNewPayment({ ...newPayment, residentEmail: e.target.value })}
                placeholder="correo@ejemplo.com"
                className="bg-input border-border text-foreground"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descripcion</Label>
              <Input
                id="description"
                value={newPayment.description}
                onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
                placeholder="Cobro cuota mensual febrero 2026"
                className="bg-input border-border text-foreground"
              />
            </div>

            <div className="flex items-center justify-between space-y-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor="amountType">Tipo de monto</Label>
                <span className="text-xs text-muted-foreground">
                  {newPayment.amountType === 'CLOSE' ? 'Monto fijo definido' : 'El residente define el monto'}
                </span>
              </div>
              <Switch
                id="amountType"
                checked={newPayment.amountType === 'OPEN'}
                onCheckedChange={(checked) => setNewPayment({ ...newPayment, amountType: checked ? 'OPEN' : 'CLOSE' })}
              />
            </div>

            {newPayment.amountType === 'CLOSE' && (
              <div className="space-y-2">
                <Label htmlFor="amount">Monto (COP)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                  placeholder="450000"
                  className="bg-input border-border text-foreground"
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewPayment(false)}>
              Cancelar
            </Button>
            {newPayment.sendLink ? (
              <Button 
                onClick={handleCreatePaymentLink} 
                disabled={
                  sendingLink || 
                  !newPayment.description || 
                  !newPayment.residentUnit ||
                  (newPayment.amountType === 'CLOSE' && !newPayment.amount)
                }
              >
                {sendingLink ? 'Creando...' : 'Crear y Enviar Link'}
              </Button>
            ) : (
              <Button 
                onClick={handleAddPayment} 
                disabled={!newPayment.description || !newPayment.amount || !newPayment.residentUnit}
              >
                Crear Cobro
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!createdLink} onOpenChange={() => setCreatedLink(null)}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Link de Pago Creado</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              El link de pago ha sido creado exitosamente
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Link de pago:</p>
              <div className="flex items-center gap-2">
                <code className="text-xs text-foreground flex-1 truncate">{createdLink?.url}</code>
                <Button variant="ghost" size="icon" onClick={() => copyLinkToClipboard(createdLink?.url || '')}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Comparte este link con el residente para que pueda realizar el pago.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatedLink(null)}>
              Cerrar
            </Button>
            <Button asChild>
              <a href={createdLink?.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir en Bold
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
                <TableHead className="text-muted-foreground">Descripcion</TableHead>
                <TableHead className="text-muted-foreground">Tipo</TableHead>
                <TableHead className="text-muted-foreground">Unidad</TableHead>
                <TableHead className="text-muted-foreground text-right">Monto</TableHead>
                <TableHead className="text-muted-foreground">Estado</TableHead>
                <TableHead className="text-muted-foreground">Link</TableHead>
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
                    <TableCell className="text-foreground">{payment.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-border text-muted-foreground">
                        <CreditCard className="mr-1 h-3 w-3" />
                        {typeLabels[payment.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-foreground">
                      {payment.residentUnit || '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium text-foreground">
                      {payment.amountType === 'OPEN' ? 'Monto abierto' : formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge className={status.className}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {payment.boldUrl ? (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={payment.boldUrl} target="_blank" rel="noopener noreferrer" title="Abrir link de pago">
                            <Link className="h-4 w-4" />
                          </a>
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
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
