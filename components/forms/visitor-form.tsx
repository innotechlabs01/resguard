'use client'

import { useState } from 'react'
import { UserPlus, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useVisitorApi } from '@/hooks/useApiMutations'

interface VisitorFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  buildingId: string
  onSuccess?: () => void
}

export function VisitorForm({ open, onOpenChange, buildingId, onSuccess }: VisitorFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { createVisitor } = useVisitorApi()

  const [formData, setFormData] = useState({
    name: '',
    document_id: '',
    type: 'pedestrian' as 'pedestrian' | 'vehicle',
    vehicle_plate: '',
    destination_unit: '',
    resident_name: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await createVisitor({
        building_id: buildingId,
        name: formData.name,
        document_id: formData.document_id,
        type: formData.type,
        vehicle_plate: formData.type === 'vehicle' ? formData.vehicle_plate : undefined,
        destination_unit: formData.destination_unit,
        resident_name: formData.resident_name,
      })

      if (result.success) {
        setFormData({
          name: '',
          document_id: '',
          type: 'pedestrian',
          vehicle_plate: '',
          destination_unit: '',
          resident_name: '',
        })
        onSuccess?.()
        onOpenChange(false)
      } else {
        setError(result.error || 'Error al registrar visitante')
      }
    } catch (err) {
      setError('Error de conexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Registrar Visitante
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nombre Completo</Label>
            <Input
              id="name"
              placeholder="Ej: Juan Perez"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="document_id">Numero de Documento</Label>
            <Input
              id="document_id"
              placeholder="Ej: 12345678"
              value={formData.document_id}
              onChange={(e) => setFormData({ ...formData, document_id: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de Visitante</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="pedestrian"
                  checked={formData.type === 'pedestrian'}
                  onChange={() => setFormData({ ...formData, type: 'pedestrian' })}
                  className="accent-foreground"
                />
                <span>Peatonal</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="vehicle"
                  checked={formData.type === 'vehicle'}
                  onChange={() => setFormData({ ...formData, type: 'vehicle' })}
                  className="accent-foreground"
                />
                <span>Vehiculo</span>
              </label>
            </div>
          </div>

          {formData.type === 'vehicle' && (
            <div className="space-y-2">
              <Label htmlFor="vehicle_plate">Placa del Vehiculo</Label>
              <Input
                id="vehicle_plate"
                placeholder="Ej: ABC-123"
                value={formData.vehicle_plate}
                onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value })}
                required
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="destination_unit">Unidad de Destino</Label>
              <Input
                id="destination_unit"
                placeholder="Ej: 301"
                value={formData.destination_unit}
                onChange={(e) => setFormData({ ...formData, destination_unit: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resident_name">Nombre del Residente</Label>
              <Input
                id="resident_name"
                placeholder="Ej: Roberto Mendez"
                value={formData.resident_name}
                onChange={(e) => setFormData({ ...formData, resident_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Visitante
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
