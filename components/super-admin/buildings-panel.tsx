'use client'

import { useState } from 'react'
import {
  Search,
  Plus,
  Building2,
  MapPin,
  Users,
  Car,
  DollarSign,
  MoreHorizontal,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import type { BuildingStats } from '@/lib/types'

interface BuildingsPanelProps {
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

const statusConfig = {
  active: { icon: CheckCircle2, label: 'Activo', className: 'bg-success/10 text-success' },
  inactive: { icon: XCircle, label: 'Inactivo', className: 'bg-muted text-muted-foreground' },
  maintenance: { icon: AlertTriangle, label: 'Mantenimiento', className: 'bg-warning/10 text-warning' },
}

const subscriptionConfig = {
  active: { label: 'Al dia', className: 'bg-success/10 text-success' },
  past_due: { label: 'Vencido', className: 'bg-destructive/10 text-destructive' },
  canceled: { label: 'Cancelado', className: 'bg-muted text-muted-foreground' },
  trialing: { label: 'Prueba', className: 'bg-info/10 text-info' },
}

export function BuildingsPanel({ buildings }: BuildingsPanelProps) {
  const [search, setSearch] = useState('')
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const filteredBuildings = buildings.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.address.toLowerCase().includes(search.toLowerCase())
  )

  const totalRevenue = buildings.reduce((sum, b) => sum + b.monthlyRevenue, 0)
  const totalResidents = buildings.reduce((sum, b) => sum + b.occupiedUnits, 0)
  const activeBuildings = buildings.filter((b) => b.status === 'active').length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Edificios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{buildings.length}</div>
            <p className="text-xs text-muted-foreground">{activeBuildings} activos</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Unidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {buildings.reduce((sum, b) => sum + b.totalUnits, 0)}
            </div>
            <p className="text-xs text-muted-foreground">{totalResidents} ocupadas</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">este mes</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cartera Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(buildings.reduce((sum, b) => sum + b.outstandingBalance, 0))}
            </div>
            <p className="text-xs text-muted-foreground">pendiente de cobro</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar edificio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-input border-border text-foreground"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filtrar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Edificio
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Edificio</DialogTitle>
                <DialogDescription>
                  Complete la informacion para registrar un nuevo edificio en el sistema.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Edificio</Label>
                  <Input id="name" placeholder="Torres del Parque" className="bg-input" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Direccion</Label>
                  <Input id="address" placeholder="Calle 26 #5-21, Bogota" className="bg-input" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="units">Total Unidades</Label>
                    <Input id="units" type="number" placeholder="120" className="bg-input" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parking">Parqueaderos Visitantes</Label>
                    <Input id="parking" type="number" placeholder="20" className="bg-input" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Email del Administrador</Label>
                  <Input id="adminEmail" type="email" placeholder="admin@edificio.com" className="bg-input" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setAddDialogOpen(false)}>
                  Crear Edificio
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Buildings Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-muted/50">
                <TableHead className="text-muted-foreground">Edificio</TableHead>
                <TableHead className="text-muted-foreground">Unidades</TableHead>
                <TableHead className="text-muted-foreground">Parqueaderos</TableHead>
                <TableHead className="text-muted-foreground">Ingresos/Mes</TableHead>
                <TableHead className="text-muted-foreground">Cartera</TableHead>
                <TableHead className="text-muted-foreground">Estado</TableHead>
                <TableHead className="text-muted-foreground">Suscripcion</TableHead>
                <TableHead className="text-muted-foreground w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBuildings.map((building) => {
                const status = statusConfig[building.status]
                const StatusIcon = status.icon
                const subscription = subscriptionConfig[building.subscriptionStatus]
                
                return (
                  <TableRow key={building.id} className="border-border hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{building.name}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {building.address}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{building.occupiedUnits}/{building.totalUnits}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{building.visitorParkingSpots}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{formatCurrency(building.monthlyRevenue)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {building.outstandingBalance > 0 ? (
                        <span className="text-destructive">{formatCurrency(building.outstandingBalance)}</span>
                      ) : (
                        <span className="text-success">$0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={status.className}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={subscription.className}>
                        {subscription.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem>Editar</DropdownMenuItem>
                          <DropdownMenuItem>Ver Pagos</DropdownMenuItem>
                          <DropdownMenuItem>Gestionar Usuarios</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            Desactivar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
