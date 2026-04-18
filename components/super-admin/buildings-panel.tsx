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
  Pencil,
  CreditCard,
  UserCog,
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
import { BuildingForm } from '@/components/forms/building-form'
import type { BuildingStats } from '@/lib/types'

interface BuildingsPanelProps {
  buildings: BuildingStats[]
  onRefresh?: () => void
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

export function BuildingsPanel({ buildings, onRefresh }: BuildingsPanelProps) {
  const [search, setSearch] = useState('')
  const [showBuildingForm, setShowBuildingForm] = useState(false)
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingStats | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPaymentsDialog, setShowPaymentsDialog] = useState(false)
  const [showUsersDialog, setShowUsersDialog] = useState(false)

  const filteredBuildings = buildings.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.address.toLowerCase().includes(search.toLowerCase())
  )

  const totalRevenue = buildings.reduce((sum, b) => sum + b.monthlyRevenue, 0)
  const totalResidents = buildings.reduce((sum, b) => sum + b.occupiedUnits, 0)
  const activeBuildings = buildings.filter((b) => b.status === 'active').length

  const handleViewDetail = (building: BuildingStats) => {
    setSelectedBuilding(building)
    setShowDetailDialog(true)
  }

  const handleEdit = (building: BuildingStats) => {
    setSelectedBuilding(building)
    setShowEditDialog(true)
  }

  const handleViewPayments = (building: BuildingStats) => {
    setSelectedBuilding(building)
    setShowPaymentsDialog(true)
  }

  const handleManageUsers = (building: BuildingStats) => {
    setSelectedBuilding(building)
    setShowUsersDialog(true)
  }

  const handleBuildingCreated = () => {
    onRefresh?.()
  }

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
          <Button size="sm" onClick={() => setShowBuildingForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Edificio
          </Button>
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
                          <DropdownMenuItem onClick={() => handleViewDetail(building)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(building)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewPayments(building)}>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Ver Pagos
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleManageUsers(building)}>
                            <UserCog className="mr-2 h-4 w-4" />
                            Gestionar Usuarios
                          </DropdownMenuItem>
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

      {/* Building Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detalle del Edificio</DialogTitle>
            <DialogDescription>
              Informacion completa del edificio seleccionado.
            </DialogDescription>
          </DialogHeader>
          {selectedBuilding && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{selectedBuilding.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedBuilding.address}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Unidades</p>
                  <p className="font-medium text-foreground">{selectedBuilding.occupiedUnits}/{selectedBuilding.totalUnits}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Parqueaderos</p>
                  <p className="font-medium text-foreground">{selectedBuilding.totalParkingSpots} total, {selectedBuilding.visitorParkingSpots} visitantes</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ingresos Mensuales</p>
                  <p className="font-medium text-foreground">{formatCurrency(selectedBuilding.monthlyRevenue)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cartera Pendiente</p>
                  <p className="font-medium text-destructive">{formatCurrency(selectedBuilding.outstandingBalance)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Visitantes Activos</p>
                  <p className="font-medium text-foreground">{selectedBuilding.activeVisitors}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Alertas Pendientes</p>
                  <p className="font-medium text-foreground">{selectedBuilding.pendingAlerts}</p>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Building Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Edificio</DialogTitle>
            <DialogDescription>
              Modifique la informacion del edificio.
            </DialogDescription>
          </DialogHeader>
          {selectedBuilding && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre del Edificio</Label>
                <Input id="edit-name" defaultValue={selectedBuilding.name} className="bg-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Direccion</Label>
                <Input id="edit-address" defaultValue={selectedBuilding.address} className="bg-input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-units">Total Unidades</Label>
                  <Input id="edit-units" type="number" defaultValue={selectedBuilding.totalUnits} className="bg-input" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-parking">Parqueaderos Visitantes</Label>
                  <Input id="edit-parking" type="number" defaultValue={selectedBuilding.visitorParkingSpots} className="bg-input" />
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setShowEditDialog(false)}>
              Guardar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payments Dialog */}
      <Dialog open={showPaymentsDialog} onOpenChange={setShowPaymentsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Pagos del Edificio</DialogTitle>
            <DialogDescription>
              Historial de pagos de {selectedBuilding?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Fecha</TableHead>
                  <TableHead className="text-muted-foreground">Concepto</TableHead>
                  <TableHead className="text-muted-foreground">Monto</TableHead>
                  <TableHead className="text-muted-foreground">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="border-border">
                  <TableCell className="text-foreground">2026-03-20</TableCell>
                  <TableCell className="text-foreground">Cuota administracion</TableCell>
                  <TableCell className="text-foreground">{formatCurrency(selectedBuilding?.monthlyRevenue || 0)}</TableCell>
                  <TableCell><Badge className="bg-success/10 text-success">Pagado</Badge></TableCell>
                </TableRow>
                <TableRow className="border-border">
                  <TableCell className="text-foreground">2026-02-20</TableCell>
                  <TableCell className="text-foreground">Cuota administracion</TableCell>
                  <TableCell className="text-foreground">{formatCurrency(selectedBuilding?.monthlyRevenue || 0)}</TableCell>
                  <TableCell><Badge className="bg-success/10 text-success">Pagado</Badge></TableCell>
                </TableRow>
                <TableRow className="border-border">
                  <TableCell className="text-foreground">2026-01-20</TableCell>
                  <TableCell className="text-foreground">Cuota administracion</TableCell>
                  <TableCell className="text-foreground">{formatCurrency(selectedBuilding?.monthlyRevenue || 0)}</TableCell>
                  <TableCell><Badge className="bg-success/10 text-success">Pagado</Badge></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowPaymentsDialog(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Users Management Dialog */}
      <Dialog open={showUsersDialog} onOpenChange={setShowUsersDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Gestionar Usuarios</DialogTitle>
            <DialogDescription>
              Usuarios asignados a {selectedBuilding?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Nombre</TableHead>
                  <TableHead className="text-muted-foreground">Email</TableHead>
                  <TableHead className="text-muted-foreground">Rol</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="border-border">
                  <TableCell className="text-foreground">Admin Demo</TableCell>
                  <TableCell className="text-foreground">admin@demo.com</TableCell>
                  <TableCell><Badge>Administrador</Badge></TableCell>
                </TableRow>
                <TableRow className="border-border">
                  <TableCell className="text-foreground">Vigilante Demo</TableCell>
                  <TableCell className="text-foreground">vigilante@demo.com</TableCell>
                  <TableCell><Badge>Vigilante</Badge></TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <p className="text-xs text-muted-foreground mt-4">
              Los usuarios se cargaran desde la base de datos cuando este conectado.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowUsersDialog(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BuildingForm
        open={showBuildingForm}
        onOpenChange={setShowBuildingForm}
        onSuccess={handleBuildingCreated}
      />
    </div>
  )
}
