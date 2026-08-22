'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
import { Car, Plus, Edit, Trash2, User, Home } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import type { ParkingAssignment } from '@/lib/types'

interface Props {
  assignments?: ParkingAssignment[]
}

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

export function ParkingOwnershipPanel({ assignments: propAssignments }: Props) {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState<ParkingAssignment[]>(propAssignments || [])
  const [loading, setLoading] = useState(!propAssignments)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ParkingAssignment | null>(null)
  const [form, setForm] = useState({
    spot_code: '',
    assignment_type: 'available' as 'owner' | 'rented' | 'available',
    owner_name: '',
    owner_unit: '',
    tenant_name: '',
    tenant_unit: '',
    vehicle_plate: '',
    vehicle_brand: '',
    vehicle_color: '',
  })

  useEffect(() => {
    if (!propAssignments && user?.buildingId) {
      fetch(`/api/parking-assignments?buildingId=${user.buildingId}`)
        .then(r => r.json())
        .then(data => setAssignments((data.assignments || []).map(mapAssignment)))
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [propAssignments, user?.buildingId])

  const handleSave = async () => {
    if (!user?.buildingId || !form.spot_code) return

    try {
      const res = await fetch('/api/parking-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          building_id: user.buildingId,
          spot_code: form.spot_code,
          assignment_type: form.assignment_type,
          owner_name: form.owner_name || undefined,
          owner_unit: form.owner_unit || undefined,
          tenant_name: form.assignment_type === 'rented' ? form.tenant_name || undefined : undefined,
          tenant_unit: form.assignment_type === 'rented' ? form.tenant_unit || undefined : undefined,
          vehicle_plate: form.vehicle_plate || undefined,
          vehicle_brand: form.vehicle_brand || undefined,
          vehicle_color: form.vehicle_color || undefined,
        }),
      })

      if (res.ok) {
        // Refresh list
        const listRes = await fetch(`/api/parking-assignments?buildingId=${user.buildingId}`)
        const data = await listRes.json()
        setAssignments((data.assignments || []).map(mapAssignment))
        setDialogOpen(false)
        setForm({ spot_code: '', assignment_type: 'available', owner_name: '', owner_unit: '', tenant_name: '', tenant_unit: '', vehicle_plate: '', vehicle_brand: '', vehicle_color: '' })
        setEditing(null)
      }
    } catch (error) {
      console.error('Error saving assignment:', error)
    }
  }

  const handleEdit = (assignment: ParkingAssignment) => {
    setEditing(assignment)
    setForm({
      spot_code: assignment.spotCode,
      assignment_type: assignment.assignmentType,
      owner_name: assignment.ownerName || '',
      owner_unit: assignment.ownerUnit || '',
      tenant_name: assignment.tenantName || '',
      tenant_unit: assignment.tenantUnit || '',
      vehicle_plate: assignment.vehiclePlate || '',
      vehicle_brand: assignment.vehicleBrand || '',
      vehicle_color: assignment.vehicleColor || '',
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este registro?')) return
    try {
      await fetch(`/api/parking-assignments?id=${id}`, { method: 'DELETE' })
      setAssignments(prev => prev.filter(a => a.id !== id))
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          Parqueaderos del Edificio
        </CardTitle>
        <Button size="sm" onClick={() => { setEditing(null); setForm({ spot_code: '', assignment_type: 'available', owner_name: '', owner_unit: '', tenant_name: '', tenant_unit: '', vehicle_plate: '', vehicle_brand: '', vehicle_color: '' }); setDialogOpen(true) }}>
          <Plus className="h-4 w-4 mr-1" /> Registrar
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-sm">Cargando...</p>
        ) : assignments.length === 0 ? (
          <p className="text-muted-foreground text-sm">No hay parqueaderos registrados</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Persona</TableHead>
                <TableHead>Vehículo</TableHead>
                <TableHead className="w-20">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((a) => {
                const cfg = typeConfig[a.assignmentType]
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono font-bold">{a.spotCode}</TableCell>
                    <TableCell>
                      <Badge className={cfg.color}>{cfg.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {a.assignmentType === 'available' ? (
                        <span className="text-muted-foreground">—</span>
                      ) : a.assignmentType === 'owner' ? (
                        <div className="flex items-center gap-1 text-sm">
                          <User className="h-3 w-3" />
                          {a.ownerName || 'Propietario'}
                          {a.ownerUnit && <span className="text-muted-foreground">• {a.ownerUnit}</span>}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-sm">
                          <User className="h-3 w-3" />
                          {a.tenantName || 'Inquilino'}
                          {a.tenantUnit && <span className="text-muted-foreground">• {a.tenantUnit}</span>}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {a.vehiclePlate ? (
                        <div className="text-sm">
                          <span className="font-mono">{a.vehiclePlate}</span>
                          {a.vehicleBrand && <span className="text-muted-foreground ml-1">{a.vehicleBrand}</span>}
                          {a.vehicleColor && <span className="text-muted-foreground">• {a.vehicleColor}</span>}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(a)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Parqueadero' : 'Registrar Parqueadero'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Modifica la información del parqueadero' : 'Registra un parqueadero del edificio'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Código del Parqueadero *</Label>
              <Input
                value={form.spot_code}
                onChange={(e) => setForm({ ...form, spot_code: e.target.value })}
                placeholder="Ej: P-401"
                disabled={!!editing}
              />
            </div>

            <div>
              <Label>Estado</Label>
              <Select value={form.assignment_type} onValueChange={(v: any) => setForm({ ...form, assignment_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Disponible</SelectItem>
                  <SelectItem value="owner">Propietario con vehículo</SelectItem>
                  <SelectItem value="rented">Alquilado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.assignment_type === 'owner' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Nombre Propietario</Label>
                    <Input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} placeholder="Juan Pérez" />
                  </div>
                  <div>
                    <Label>Unidad</Label>
                    <Input value={form.owner_unit} onChange={(e) => setForm({ ...form, owner_unit: e.target.value })} placeholder="401" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Placa</Label>
                    <Input value={form.vehicle_plate} onChange={(e) => setForm({ ...form, vehicle_plate: e.target.value })} placeholder="ABC-123" />
                  </div>
                  <div>
                    <Label>Marca</Label>
                    <Input value={form.vehicle_brand} onChange={(e) => setForm({ ...form, vehicle_brand: e.target.value })} placeholder="Toyota" />
                  </div>
                  <div>
                    <Label>Color</Label>
                    <Input value={form.vehicle_color} onChange={(e) => setForm({ ...form, vehicle_color: e.target.value })} placeholder="Blanco" />
                  </div>
                </div>
              </>
            )}

            {form.assignment_type === 'rented' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Nombre Inquilino</Label>
                    <Input value={form.tenant_name} onChange={(e) => setForm({ ...form, tenant_name: e.target.value })} placeholder="María López" />
                  </div>
                  <div>
                    <Label>Unidad Inquilino</Label>
                    <Input value={form.tenant_unit} onChange={(e) => setForm({ ...form, tenant_unit: e.target.value })} placeholder="301" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Placa</Label>
                    <Input value={form.vehicle_plate} onChange={(e) => setForm({ ...form, vehicle_plate: e.target.value })} placeholder="DEF-456" />
                  </div>
                  <div>
                    <Label>Marca</Label>
                    <Input value={form.vehicle_brand} onChange={(e) => setForm({ ...form, vehicle_brand: e.target.value })} placeholder="Mazda" />
                  </div>
                  <div>
                    <Label>Color</Label>
                    <Input value={form.vehicle_color} onChange={(e) => setForm({ ...form, vehicle_color: e.target.value })} placeholder="Rojo" />
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.spot_code}>
              {editing ? 'Guardar Cambios' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
