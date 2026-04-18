'use client'

import { useState } from 'react'
import { Car, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useParkingApi } from '@/hooks/useApiMutations'

interface ParkingSpotFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  buildingId: string
  existingSpots?: number
  onSuccess?: () => void
}

export function ParkingSpotForm({
  open,
  onOpenChange,
  buildingId,
  existingSpots = 0,
  onSuccess,
}: ParkingSpotFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { createParkingSpot } = useParkingApi()

  const [formData, setFormData] = useState({
    code: '',
    max_duration: '120',
    quantity: '1',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const quantity = parseInt(formData.quantity)

      for (let i = 0; i < quantity; i++) {
        const code = quantity === 1
          ? formData.code
          : `${formData.code}${i + 1}`.toUpperCase()

        await createParkingSpot({
          building_id: buildingId,
          code,
          max_duration: parseInt(formData.max_duration),
        })
      }

      setFormData({
        code: '',
        max_duration: '120',
        quantity: '1',
      })
      onSuccess?.()
      onOpenChange(false)
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
            <Car className="h-5 w-5" />
            Agregar Parqueadero(s)
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="code">Codigo del Parqueadero</Label>
            <Input
              id="code"
              placeholder="Ej: V- o P-301-"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              required
            />
            <p className="text-xs text-muted-foreground">
              El codigo se usara como prefijo. Para crear varios, se agregara un numero secuencial.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max="50"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_duration">Duracion Maxima (min)</Label>
              <Input
                id="max_duration"
                type="number"
                min="30"
                max="480"
                value={formData.max_duration}
                onChange={(e) => setFormData({ ...formData, max_duration: e.target.value })}
                required
              />
            </div>
          </div>

          {parseInt(formData.quantity) > 1 && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Se crearan los parqueaderos:
                <br />
                <span className="font-mono text-foreground">
                  {formData.code}1, {formData.code}2, ... {formData.code}{parseInt(formData.quantity)}
                </span>
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Agregar Parqueadero(s)
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
