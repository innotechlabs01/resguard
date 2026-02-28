'use client'

import { useState } from 'react'
import {
  Search,
  Plus,
  Mail,
  Phone,
  Car,
  DollarSign,
  MoreHorizontal,
  Download,
  KeyRound,
  User,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  X,
  Edit,
  Send,
  History,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import type { Resident } from '@/lib/types'
import { mockResidents, mockTenants } from '@/lib/mock-data'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount)
}

function ResidentDetailDialog({
  resident,
  open,
  onClose,
}: {
  resident: Resident | null
  open: boolean
  onClose: () => void
}) {
  if (!resident) return null

  const tenant = resident.isTenant
    ? mockTenants.find((t) => t.unit === resident.unit)
    : null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
              {resident.name.charAt(0)}
            </div>
            {resident.name}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Unidad {resident.unit} &mdash; {resident.isTenant ? 'Inquilino (arrendatario)' : 'Propietario'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info">
          <TabsList className="w-full bg-muted">
            <TabsTrigger value="info" className="flex-1">Informacion</TabsTrigger>
            <TabsTrigger value="financial" className="flex-1">Financiero</TabsTrigger>
            {resident.isTenant && <TabsTrigger value="contrato" className="flex-1">Contrato</TabsTrigger>}
          </TabsList>

          <TabsContent value="info" className="mt-4 space-y-3">
            <div className="space-y-2 rounded-lg border border-border p-3 bg-muted/20">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-foreground">{resident.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-foreground">{resident.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Car className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-foreground">
                  {resident.parkingSpots.length > 0 ? resident.parkingSpots.join(', ') : 'Sin parqueadero asignado'}
                </span>
              </div>
            </div>
            {resident.hasRentalListing && (
              <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-primary">
                <KeyRound className="h-3.5 w-3.5" />
                Tiene apartamento o parqueadero publicado en alquiler
              </div>
            )}
          </TabsContent>

          <TabsContent value="financial" className="mt-4 space-y-3">
            <div className={`rounded-lg border p-4 text-center ${resident.balance < 0 ? 'border-destructive/30 bg-destructive/5' : 'border-success/30 bg-success/5'}`}>
              <p className="text-xs text-muted-foreground mb-1">Balance actual</p>
              <p className={`text-3xl font-bold ${resident.balance < 0 ? 'text-destructive' : 'text-success'}`}>
                {formatCurrency(Math.abs(resident.balance))}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {resident.balance < 0 ? 'Saldo pendiente de pago' : resident.balance === 0 ? 'Al dia' : 'Saldo a favor'}
              </p>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Cuota mensual admin.</span>
                <span className="text-foreground font-medium">{formatCurrency(450000)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Parqueadero</span>
                <span className="text-foreground font-medium">
                  {resident.parkingSpots.length > 0 ? formatCurrency(50000 * resident.parkingSpots.length) : 'N/A'}
                </span>
              </div>
            </div>
          </TabsContent>

          {tenant && (
            <TabsContent value="contrato" className="mt-4 space-y-3">
              <div className="space-y-2 text-sm rounded-lg border border-border p-3 bg-muted/20">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Propietario</span>
                  <span className="text-foreground font-medium">{tenant.ownerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Apto propietario</span>
                  <span className="text-foreground">{tenant.ownerUnit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Inicio contrato</span>
                  <span className="text-foreground">{tenant.leaseStart.toLocaleDateString('es-CO')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fin contrato</span>
                  <span className="text-foreground">{tenant.leaseEnd.toLocaleDateString('es-CO')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Canon mensual</span>
                  <span className="text-foreground font-semibold">{formatCurrency(tenant.monthlyRent)}</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground rounded-lg border border-border px-3 py-2">
                <p className="font-medium text-foreground mb-1">Vehiculos del inquilino</p>
                {tenant.vehicles.length === 0 ? (
                  <p className="italic">Sin vehiculos registrados</p>
                ) : (
                  tenant.vehicles.map((v) => (
                    <span key={v.id} className="font-mono text-primary font-bold mr-3">{v.plate}</span>
                  ))
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export function ResidentsPanel() {
  const [search, setSearch] = useState('')
  const [residents, setResidents] = useState<Resident[]>(mockResidents)
  const [typeFilter, setTypeFilter] = useState<'all' | 'owner' | 'tenant'>('all')
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'debt' | 'paid'>('all')
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showNewResident, setShowNewResident] = useState(false)
  const [newResident, setNewResident] = useState({
    name: '',
    unit: '',
    phone: '',
    email: '',
    isTenant: false,
  })

  const handleAddResident = () => {
    if (!newResident.name || !newResident.unit || !newResident.email) return
    
    const resident: Resident = {
      id: Math.random().toString(36).slice(2),
      name: newResident.name,
      unit: newResident.unit,
      phone: newResident.phone,
      email: newResident.email,
      parkingSpots: [],
      balance: 0,
      isTenant: newResident.isTenant,
    }
    
    setResidents([resident, ...residents])
    setNewResident({ name: '', unit: '', phone: '', email: '', isTenant: false })
    setShowNewResident(false)
  }

  const filteredResidents = residents.filter((r) => {
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.unit.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase())
    const matchType =
      typeFilter === 'all' ||
      (typeFilter === 'owner' && !r.isTenant) ||
      (typeFilter === 'tenant' && r.isTenant)
    const matchBalance =
      balanceFilter === 'all' ||
      (balanceFilter === 'debt' && r.balance < 0) ||
      (balanceFilter === 'paid' && r.balance >= 0)
    return matchSearch && matchType && matchBalance
  })

  const totalDebt = residents.reduce((sum, r) => sum + Math.abs(Math.min(0, r.balance)), 0)
  const residentsWithDebt = residents.filter((r) => r.balance < 0).length
  const tenantCount = residents.filter((r) => r.isTenant).length

  const activeFilters = (typeFilter !== 'all' ? 1 : 0) + (balanceFilter !== 'all' ? 1 : 0)

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Propietarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{residents.length - tenantCount}</div>
            <p className="text-xs text-muted-foreground mt-0.5">{tenantCount} con inquilinos</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Inquilinos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{tenantCount}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Arrendatarios activos</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              En mora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{residentsWithDebt}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Cuotas pendientes</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Cartera total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totalDebt)}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Por cobrar</p>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, unidad o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-input border-border text-foreground"
            />
          </div>

          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
            <SelectTrigger className="w-40 bg-input border-border text-foreground">
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="owner">Propietarios</SelectItem>
              <SelectItem value="tenant">Inquilinos</SelectItem>
            </SelectContent>
          </Select>

          <Select value={balanceFilter} onValueChange={(v) => setBalanceFilter(v as typeof balanceFilter)}>
            <SelectTrigger className="w-36 bg-input border-border text-foreground">
              <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="debt">En mora</SelectItem>
              <SelectItem value="paid">Al dia</SelectItem>
            </SelectContent>
          </Select>

          {activeFilters > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => { setTypeFilter('all'); setBalanceFilter('all') }}
            >
              <X className="mr-1 h-3 w-3" />
              Limpiar ({activeFilters})
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button size="sm" onClick={() => setShowNewResident(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Residente
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Unidad / Residente</TableHead>
                <TableHead className="text-muted-foreground">Tipo</TableHead>
                <TableHead className="text-muted-foreground">Contacto</TableHead>
                <TableHead className="text-muted-foreground">Parqueadero</TableHead>
                <TableHead className="text-muted-foreground text-right">Balance</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResidents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    No se encontraron residentes
                  </TableCell>
                </TableRow>
              )}
              {filteredResidents.map((resident) => (
                <TableRow key={resident.id} className="border-border hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground shrink-0">
                        {resident.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{resident.name}</p>
                        <p className="text-xs text-muted-foreground">Apto {resident.unit}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {resident.isTenant ? (
                      <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 text-xs">
                        <KeyRound className="mr-1 h-3 w-3" />
                        Inquilino
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground text-xs">
                        <User className="mr-1 h-3 w-3" />
                        Propietario
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-[160px]">{resident.email}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3 shrink-0" />
                        {resident.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {resident.parkingSpots.length > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <Car className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs font-mono font-semibold text-foreground">
                          {resident.parkingSpots.join(', ')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin cupo</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {resident.balance >= 0 ? (
                      <Badge className="bg-success/10 text-success border-success/20 border text-xs">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Al dia
                      </Badge>
                    ) : (
                      <Badge className="bg-destructive/10 text-destructive border-destructive/20 border text-xs">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        {formatCurrency(Math.abs(resident.balance))}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border">
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => { setSelectedResident(resident); setShowDetail(true) }}
                        >
                          <User className="mr-2 h-4 w-4" />
                          Ver perfil completo
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                          <Edit className="mr-2 h-4 w-4" />
                          Editar datos
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                          <History className="mr-2 h-4 w-4" />
                          Historial de pagos
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer text-primary">
                          <Send className="mr-2 h-4 w-4" />
                          Enviar recordatorio de cobro
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ResidentDetailDialog
        resident={selectedResident}
        open={showDetail}
        onClose={() => setShowDetail(false)}
      />

      <Dialog open={showNewResident} onOpenChange={setShowNewResident}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Nuevo Residente</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Agrega los datos del nuevo residente o inquilino
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                value={newResident.name}
                onChange={(e) => setNewResident({ ...newResident, name: e.target.value })}
                placeholder="Juan Perez"
                className="bg-input border-border text-foreground"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="unit">Unidad</Label>
              <Input
                id="unit"
                value={newResident.unit}
                onChange={(e) => setNewResident({ ...newResident, unit: e.target.value })}
                placeholder="101"
                className="bg-input border-border text-foreground"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Correo electronico</Label>
              <Input
                id="email"
                type="email"
                value={newResident.email}
                onChange={(e) => setNewResident({ ...newResident, email: e.target.value })}
                placeholder="juan@correo.com"
                className="bg-input border-border text-foreground"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Telefono</Label>
              <Input
                id="phone"
                value={newResident.phone}
                onChange={(e) => setNewResident({ ...newResident, phone: e.target.value })}
                placeholder="3001234567"
                className="bg-input border-border text-foreground"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isTenant"
                checked={newResident.isTenant}
                onCheckedChange={(checked) => setNewResident({ ...newResident, isTenant: checked === true })}
              />
              <label
                htmlFor="isTenant"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground"
              >
                Es inquilino (arrendatario)
              </label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewResident(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddResident} disabled={!newResident.name || !newResident.unit || !newResident.email}>
              Agregar Residente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
