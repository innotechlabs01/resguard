'use client'

import { useState } from 'react'
import { Users, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useResidentApi } from '@/hooks/useApiMutations'

interface ResidentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  buildingId: string
  onSuccess?: () => void
}

export function ResidentForm({ open, onOpenChange, buildingId, onSuccess }: ResidentFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { createResident } = useResidentApi()

  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    phone: '',
    email: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await createResident({
        building_id: buildingId,
        name: formData.name,
        unit: formData.unit,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
      })

      if (result.success) {
        setFormData({
          name: '',
          unit: '',
          phone: '',
          email: '',
        })
        onSuccess?.()
        onOpenChange(false)
      } else {
        setError(result.error || 'Error al crear residente')
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
            <Users className="h-5 w-5" />
            Nuevo Residente
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
              placeholder="Ej: Roberto Mendez"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Unidad / Apartamento</Label>
            <Input
              id="unit"
              placeholder="Ej: 301"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefono</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+57 300 123 4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Residente
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
