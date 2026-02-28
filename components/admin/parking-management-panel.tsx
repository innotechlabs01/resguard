'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Car, 
  Clock, 
  Plus, 
  Edit, 
  Trash2,
  Search,
  User,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import type { Resident, ParkingSpot } from '@/lib/types'
import { mockResidents, mockParkingSpots } from '@/lib/mock-data'

interface AssignedParking {
  id: string
  spotCode: string
  residentId: string
  residentName: string
  residentUnit: string
  vehiclePlate?: string
  vehicleBrand?: string
  assignedDate: string
  status: 'active' | 'inactive'
  monthlyRate: number
}

export function ParkingManagementPanel() {
  const [residents] = useState<Resident[]>(mockResidents)
  const [parkingSpots] = useState<ParkingSpot[]>(mockParkingSpots)
  const [assignedParkings, setAssignedParkings] = useState<AssignedParking[]>([
    {
      id: '1',
      spotCode: 'R-01',
      residentId: '1',
      residentName: 'Maria Garcia',
      residentUnit: '101',
      vehiclePlate: 'ABC-123',
      vehicleBrand: 'Toyota Corolla',
      assignedDate: '2026-01-15',
      status: 'active',
      monthlyRate: 50000,
    },
    {
      id: '2',
      spotCode: 'R-02',
      residentId: '2',
      residentName: 'Carlos Lopez',
      residentUnit: '102',
      vehiclePlate: 'XYZ-789',
      vehicleBrand: 'Honda Civic',
      assignedDate: '2026-01-20',
      status: 'active',
      monthlyRate: 50000,
    },
    {
      id: '3',
      spotCode: 'R-03',
      residentId: '3',
      residentName: 'Ana Martinez',
      residentUnit: '201',
      vehiclePlate: 'DEF-456',
      vehicleBrand: 'Nissan Sentra',
      assignedDate: '2026-02-01',
      status: 'active',
      monthlyRate: 50000,
    },
  ])
  
  const [search, setSearch] = useState('')
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedSpot, setSelectedSpot] = useState<string>('')
  const [selectedResident, setSelectedResident] = useState<string>('')
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [vehicleBrand, setVehicleBrand] = useState('')
  const [monthlyRate, setMonthlyRate] = useState('50000')

  const availableSpots = parkingSpots.filter(s => s.status === 'available').slice(0, 20)
  const residentSpots = Array.from({ length: 50 }, (_, i) => `R-${String(i + 1).padStart(2, '0')}`)
  const assignedSpotCodes = assignedParkings.map(p => p.spotCode)
  const unassignedSpots = residentSpots.filter(s => !assignedSpotCodes.includes(s))

  const filteredParkings = assignedParkings.filter(p => 
    p.residentName.toLowerCase().includes(search.toLowerCase()) ||
    p.residentUnit.toLowerCase().includes(search.toLowerCase()) ||
    p.spotCode.toLowerCase().includes(search.toLowerCase()) ||
    p.vehiclePlate?.toLowerCase().includes(search.toLowerCase())
  )

  const activeAssignments = assignedParkings.filter(p => p.status === 'active').length
  const totalMonthlyRevenue = assignedParkings
    .filter(p => p.status === 'active')
    .reduce((sum, p) => sum + p.monthlyRate, 0)

  const handleAssign = () => {
    if (!selectedSpot || !selectedResident) return
    
    const resident = residents.find(r => r.id === selectedResident)
    if (!resident) return

    const newParking: AssignedParking = {
      id: Math.random().toString(36).slice(2),
      spotCode: selectedSpot,
      residentId: selectedResident,
      residentName: resident.name,
      residentUnit: resident.unit,
      vehiclePlate: vehiclePlate || undefined,
      vehicleBrand: vehicleBrand || undefined,
      assignedDate: new Date().toISOString().split('T')[0],
      status: 'active',
      monthlyRate: parseInt(monthlyRate) || 50000,
    }

    setAssignedParkings([...assignedParkings, newParking])
    resetForm()
    setAssignDialogOpen(false)
  }

  const handleDeactivate = (id: string) => {
    setAssignedParkings(assignedParkings.map(p => 
      p.id === id ? { ...p, status: 'inactive' as const } : p
    ))
  }

  const handleReactivate = (id: string) => {
    setAssignedParkings(assignedParkings.map(p => 
      p.id === id ? { ...p, status: 'active' as const } : p
    ))
  }

  const handleDelete = (id: string) => {
    setAssignedParkings(assignedParkings.filter(p => p.id !== id))
  }

  const resetForm = () => {
    setSelectedSpot('')
    setSelectedResident('')
    setVehiclePlate('')
    setVehicleBrand('')
    setMonthlyRate('50000')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestion de Parqueaderos</h2>
          <p className="text-muted-foreground">Asigna cupos de parqueadero a los residentes</p>
        </div>
        <Button onClick={() => setAssignDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Asignar Parqueadero
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cupos Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{residentSpots.length}</div>
            <p className="text-xs text-muted-foreground">parqueaderos residentes</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Asignaciones Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{activeAssignments}</div>
            <p className="text-xs text-muted-foreground">
              {unassignedSpots.length} disponibles
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos Mensuales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              ${totalMonthlyRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">por parqueaderos</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Visitantes Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">
              {parkingSpots.filter(s => s.status === 'occupied').length}
            </div>
            <p className="text-xs text-muted-foreground">
              cupos ocupados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, unidad, cupo o placa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-input border-border text-foreground"
          />
        </div>
      </div>

      {/* Assignments Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Cupo</TableHead>
                <TableHead className="text-muted-foreground">Residente</TableHead>
                <TableHead className="text-muted-foreground">Unidad</TableHead>
                <TableHead className="text-muted-foreground">Vehiculo</TableHead>
                <TableHead className="text-muted-foreground">Tarifa Mensual</TableHead>
                <TableHead className="text-muted-foreground">Estado</TableHead>
                <TableHead className="text-muted-foreground">Fecha Asignacion</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParkings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    No se encontraron asignaciones
                  </TableCell>
                </TableRow>
              )}
              {filteredParkings.map((parking) => (
                <TableRow key={parking.id} className="border-border hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono font-medium text-foreground">{parking.spotCode}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{parking.residentName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-border text-muted-foreground">
                      <Building2 className="mr-1 h-3 w-3" />
                      {parking.residentUnit}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {parking.vehiclePlate ? (
                      <div className="flex flex-col">
                        <span className="font-mono text-sm text-foreground">{parking.vehiclePlate}</span>
                        <span className="text-xs text-muted-foreground">{parking.vehicleBrand}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Sin vehiculo</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-foreground">${parking.monthlyRate.toLocaleString()}/mes</span>
                  </TableCell>
                  <TableCell>
                    {parking.status === 'active' ? (
                      <Badge className="bg-success/10 text-success border-success/20">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Activo
                      </Badge>
                    ) : (
                      <Badge className="bg-muted text-muted-foreground">
                        <XCircle className="mr-1 h-3 w-3" />
                        Inactivo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {parking.assignedDate}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {parking.status === 'active' ? (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-warning hover:text-warning"
                          onClick={() => handleDeactivate(parking.id)}
                          title="Desactivar"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-success hover:text-success"
                          onClick={() => handleReactivate(parking.id)}
                          title="Reactivar"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(parking.id)}
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Asignar Parqueadero</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Asigna un cupo de parqueadero a un residente
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cupo de parqueadero</Label>
              <Select value={selectedSpot} onValueChange={setSelectedSpot}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder="Selecciona un cupo" />
                </SelectTrigger>
                <SelectContent>
                  {unassignedSpots.map(spot => (
                    <SelectItem key={spot} value={spot}>
                      Cupo {spot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Residente</Label>
              <Select value={selectedResident} onValueChange={setSelectedResident}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder="Selecciona un residente" />
                </SelectTrigger>
                <SelectContent>
                  {residents.map(resident => (
                    <SelectItem key={resident.id} value={resident.id}>
                      {resident.name} - Unidad {resident.unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Placa del vehiculo (opcional)</Label>
              <Input
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                placeholder="ABC-123"
                className="bg-input border-border text-foreground font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label>Marca/Modelo (opcional)</Label>
              <Input
                value={vehicleBrand}
                onChange={(e) => setVehicleBrand(e.target.value)}
                placeholder="Toyota Corolla"
                className="bg-input border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label>Tarifa mensual (COP)</Label>
              <Input
                type="number"
                value={monthlyRate}
                onChange={(e) => setMonthlyRate(e.target.value)}
                placeholder="50000"
                className="bg-input border-border text-foreground"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setAssignDialogOpen(false) }}>
              Cancelar
            </Button>
            <Button onClick={handleAssign} disabled={!selectedSpot || !selectedResident}>
              <Car className="mr-2 h-4 w-4" />
              Asignar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
