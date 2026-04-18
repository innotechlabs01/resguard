'use client'

import { useState } from 'react'
import { Building2, X, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useBuildingApi } from '@/hooks/useApiMutations'

interface BuildingFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function BuildingForm({ open, onOpenChange, onSuccess }: BuildingFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { createBuilding } = useBuildingApi()

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    total_units: '',
    total_parking_spots: '',
    visitor_parking_spots: '',
    monthly_fee: '',
    currency: 'COP',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await createBuilding({
        name: formData.name,
        address: formData.address,
        total_units: parseInt(formData.total_units),
        total_parking_spots: parseInt(formData.total_parking_spots),
        visitor_parking_spots: parseInt(formData.visitor_parking_spots),
        monthly_fee: parseInt(formData.monthly_fee),
        currency: formData.currency,
      })

      if (result.success) {
        setFormData({
          name: '',
          address: '',
          total_units: '',
          total_parking_spots: '',
          visitor_parking_spots: '',
          monthly_fee: '',
          currency: 'COP',
        })
        onSuccess?.()
        onOpenChange(false)
      } else {
        setError(result.error || 'Error al crear edificio')
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
            <Building2 className="h-5 w-5" />
            Nuevo Edificio
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Edificio</Label>
            <Input
              id="name"
              placeholder="Ej: Torres del Parque"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Direccion</Label>
            <Input
              id="address"
              placeholder="Ej: Calle 26 #5-21, Bogota"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_units">Unidades Totales</Label>
              <Input
                id="total_units"
                type="number"
                placeholder="120"
                value={formData.total_units}
                onChange={(e) => setFormData({ ...formData, total_units: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly_fee">Cuota Mensual (COP)</Label>
              <Input
                id="monthly_fee"
                type="number"
                placeholder="450000"
                value={formData.monthly_fee}
                onChange={(e) => setFormData({ ...formData, monthly_fee: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_parking_spots">Parqueaderos Totales</Label>
              <Input
                id="total_parking_spots"
                type="number"
                placeholder="150"
                value={formData.total_parking_spots}
                onChange={(e) => setFormData({ ...formData, total_parking_spots: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="visitor_parking_spots">Parqueaderos Visitantes</Label>
              <Input
                id="visitor_parking_spots"
                type="number"
                placeholder="20"
                value={formData.visitor_parking_spots}
                onChange={(e) => setFormData({ ...formData, visitor_parking_spots: e.target.value })}
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
              Crear Edificio
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
