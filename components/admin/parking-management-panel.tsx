'use client'

import { useState, useEffect } from 'react'
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
import { useAuth } from '@/lib/auth-context'
import type { Resident, ParkingSpot, ParkingAssignment } from '@/lib/types'

const typeConfig: Record<string, { label: string; color: string }> = {
  owner: { label: 'Propietario', color: 'bg-info/10 text-info' },
  rented: { label: 'Alquilado', color: 'bg-warning/10 text-warning' },
  available: { label: 'Disponible', color: 'bg-success/10 text-success' },
}

// Map DB snake_case to component camelCase
function mapAssignment(raw: any): ParkingAssignment {
  return {
    id: raw.id,
    buildingId: raw.building_id,
    spotCode: raw.spot_code,
    assignmentType: raw.assignment_type,
    ownerId: raw.owner_id,
    ownerName: raw.owner_name,
    ownerUnit: raw.owner_unit,
    tenantName: raw.tenant_name,
    tenantUnit: raw.tenant_unit,
    vehiclePlate: raw.vehicle_plate,
    vehicleBrand: raw.vehicle_brand,
    vehicleColor: raw.vehicle_color,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

interface UIAssignment {
  id: string
  spotCode: string
  residentName: string
  residentUnit: string
  vehiclePlate?: string
  vehicleBrand?: string
  assignedDate: string
  assignmentType: 'owner' | 'rented'
}

function toUIAssignment(pa: ParkingAssignment): UIAssignment {
  const isOwner = pa.assignmentType === 'owner'
  return {
    id: pa.id,
    spotCode: pa.spotCode,
    residentName: isOwner ? (pa.ownerName || 'Propietario') : (pa.tenantName || 'Inquilino'),
    residentUnit: isOwner ? (pa.ownerUnit || '') : (pa.tenantUnit || ''),
    vehiclePlate: pa.vehiclePlate || undefined,
    vehicleBrand: pa.vehicleBrand || undefined,
    assignedDate: pa.createdAt.split('T')[0],
    // 'available' is filtered out upstream; narrow to the UI union
    assignmentType: isOwner ? 'owner' : 'rented',
  }
}

function getAvailableSpots(assignments: ParkingAssignment[], maxSpots = 50): string[] {
  const used = new Set(assignments.map(a => a.spotCode))
  const available: string[] = []
  for (let i = 1; i <= maxSpots; i++) {
    const code = `R-${String(i).padStart(2, '0')}`
    if (!used.has(code)) available.push(code)
  }
  return available
}

export function ParkingManagementPanel({ residents: propResidents, parkingSpots: propParkingSpots }: { residents?: Resident[]; parkingSpots?: ParkingSpot[] } = {}) {
  const { user } = useAuth()
  const [residents] = useState<Resident[]>(propResidents || [])
  const [parkingSpots] = useState<ParkingSpot[]>(propParkingSpots || [])
  const [assignments, setAssignments] = useState<ParkingAssignment[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedSpot, setSelectedSpot] = useState<string>('')
  const [selectedResident, setSelectedResident] = useState<string>('')
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [vehicleBrand, setVehicleBrand] = useState('')
  const [monthlyRate, setMonthlyRate] = useState('50000')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (user?.buildingId) {
      fetch(`/api/parking-assignments?buildingId=${user.buildingId}`)
        .then(r => r.json())
        .then(data => {
          const mapped = (data.assignments || []).map(mapAssignment)
          setAssignments(mapped)
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [user?.buildingId])

  const refreshAssignments = async () => {
    if (!user?.buildingId) return
    try {
      const res = await fetch(`/api/parking-assignments?buildingId=${user.buildingId}`)
      const data = await res.json()
      setAssignments((data.assignments || []).map(mapAssignment))
    } catch (e) {
      console.error('Error refreshing assignments:', e)
    }
  }

  const handleAssign = async () => {
    if (!selectedSpot || !selectedResident || !user?.buildingId) return

    const resident = residents.find(r => r.id === selectedResident)
    if (!resident) return

    setSaving(true)
    try {
      const res = await fetch('/api/parking-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          building_id: user.buildingId,
          spot_code: selectedSpot,
          assignment_type: 'owner',
          owner_name: resident.name,
          owner_unit: resident.unit,
          vehicle_plate: vehiclePlate || undefined,
          vehicle_brand: vehicleBrand || undefined,
        }),
      })

      if (res.ok) {
        await refreshAssignments()
        resetForm()
        setAssignDialogOpen(false)
      }
    } catch (error) {
      console.error('Error assigning parking:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (id: string) => {
    if (!confirm('¿Desactivar esta asignación? El cupo quedará disponible.')) return
    setDeletingId(id)
    try {
      const assignment = assignments.find(a => a.id === id)
      if (!assignment || !user?.buildingId) return

      const res = await fetch('/api/parking-assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, assignment_type: 'available' }),
      })

      if (res.ok) {
        await refreshAssignments()
      }
    } catch (error) {
      console.error('Error deactivating:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const handleReactivate = async (id: string) => {
    const assignment = assignments.find(a => a.id === id)
    if (!assignment || !user?.buildingId) return

    // Need to know if it was owner or rented - for now default to owner
    setDeletingId(id)
    try {
      const res = await fetch('/api/parking-assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, assignment_type: 'owner' }),
      })

      if (res.ok) {
        await refreshAssignments()
      }
    } catch (error) {
      console.error('Error reactivating:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta asignación permanentemente?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/parking-assignments?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        await refreshAssignments()
      }
    } catch (error) {
      console.error('Error deleting:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const resetForm = () => {
    setSelectedSpot('')
    setSelectedResident('')
    setVehiclePlate('')
    setVehicleBrand('')
    setMonthlyRate('50000')
  }

  const availableSpots = parkingSpots.filter(s => s.status === 'available').slice(0, 20)
  const residentSpots = getAvailableSpots(assignments)
  const assignedSpotCodes = assignments.map(p => p.spotCode)
  const unassignedSpots = residentSpots.filter(s => !assignedSpotCodes.includes(s))

  const activeAssignments = assignments.filter(a => a.assignmentType !== 'available').length
  const totalMonthlyRevenue = activeAssignments * 50000

  // Build UI assignments from DB data (exclude 'available' type)
  const uiAssignments: UIAssignment[] = assignments
    .filter(a => a.assignmentType !== 'available')
    .map(toUIAssignment)

  const filteredParkings = uiAssignments.filter(p =>
    p.residentName.toLowerCase().includes(search.toLowerCase()) ||
    p.residentUnit.toLowerCase().includes(search.toLowerCase()) ||
    p.spotCode.toLowerCase().includes(search.toLowerCase()) ||
    p.vehiclePlate?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Gestion de Parqueaderos</h2>
          <p className="text-sm text-muted-foreground">Asigna cupos de parqueadero a los residentes</p>
        </div>
        <Button onClick={() => { resetForm(); setAssignDialogOpen(true) }} size="sm" disabled={loading}>
          <Plus className="mr-2 h-4 w-4" />
          Asignar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cupos Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">{residentSpots.length + activeAssignments}</div>
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
            <div className="text-xl sm:text-2xl font-bold text-primary">{activeAssignments}</div>
            <p className="text-xs text-muted-foreground">
              {residentSpots.length} disponibles
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
            <div className="text-xl sm:text-2xl font-bold text-success">
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
            <div className="text-xl sm:text-2xl font-bold text-info">
              {parkingSpots.filter(s => s.status === 'occupied').length}
            </div>
            <p className="text-xs text-muted-foreground">
              cupos ocupados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : filteredParkings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    No se encontraron asignaciones
                  </TableCell>
                </TableRow>
              ) : (
                filteredParkings.map((parking) => (
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
                      <span className="text-foreground">{(50000).toLocaleString()}/mes</span>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-info/10 text-info border-info/20">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        {parking.assignmentType === 'owner' ? 'Propietario' : 'Alquilado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {parking.assignedDate}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-warning hover:text-warning"
                          onClick={() => handleDeactivate(parking.id)}
                          title="Desactivar (liberar cupo)"
                          disabled={saving || deletingId === parking.id}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-success hover:text-success"
                          onClick={() => handleReactivate(parking.id)}
                          title="Reactivar como propietario"
                          disabled={saving || deletingId === parking.id}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(parking.id)}
                          title="Eliminar permanentemente"
                          disabled={saving || deletingId === parking.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
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
              <Select value={selectedSpot} onValueChange={setSelectedSpot} disabled={loading}>
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
              <Select value={selectedResident} onValueChange={setSelectedResident} disabled={loading}>
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
            <Button variant="outline" onClick={() => { resetForm(); setAssignDialogOpen(false) }} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleAssign} disabled={saving || !selectedSpot || !selectedResident || loading}>
              {saving ? 'Guardando...' : 'Asignar'}
              <Car className="mr-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}