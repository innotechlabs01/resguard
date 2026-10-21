'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Calendar,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Utensils,
  Dumbbell,
  Waves,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/lib/auth-context'
import { EmptyState } from '@/components/ui/empty-state'

interface Reservation {
  id: string
  area: string
  areaName?: string
  date: Date
  startTime: string
  endTime: string
  status: 'pending' | 'confirmed' | 'cancelled'
  guests?: number
  notes?: string
}

const areaConfig = {
  salon_social: {
    name: 'Salon Social',
    icon: Users,
    deposit: 200000,
    maxHours: 8,
    maxGuests: 50,
  },
  bbq: {
    name: 'Zona BBQ',
    icon: Utensils,
    deposit: 100000,
    maxHours: 6,
    maxGuests: 20,
  },
  gym: {
    name: 'Gimnasio',
    icon: Dumbbell,
    deposit: 0,
    maxHours: 2,
    maxGuests: 2,
  },
  pool: {
    name: 'Piscina',
    icon: Waves,
    deposit: 0,
    maxHours: 4,
    maxGuests: 4,
  },
}

const statusConfig = {
  pending: { label: 'Pendiente', color: 'text-warning bg-warning/10' },
  confirmed: { label: 'Confirmada', color: 'text-success bg-success/10' },
  cancelled: { label: 'Cancelada', color: 'text-destructive bg-destructive/10' },
}

export function UsuarioReservations() {
  const { user } = useAuth()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [areas, setAreas] = useState<{ id: string; name: string; description: string | null; max_capacity: number }[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [newReservation, setNewReservation] = useState({
    area: '',
    date: '',
    startTime: '',
    endTime: '',
    guests: '',
    notes: '',
  })

  const fetchReservations = useCallback(async () => {
    if (!user?.buildingId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/reservations?buildingId=${encodeURIComponent(user.buildingId)}`)
      if (!res.ok) throw new Error('Error al cargar')
      const data = await res.json()
      setAreas(data.areas || [])
      setReservations((data.reservations || []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        area: (r.area_id as string) || '',
        areaName: (r.area_name as string) || '',
        date: new Date(r.start_time as string),
        startTime: (r.start_time as string)?.slice(11, 16) || '',
        endTime: (r.end_time as string)?.slice(11, 16) || '',
        status: r.status as Reservation['status'],
        guests: (r.guests as number) || undefined,
        notes: (r.notes as string) || undefined,
      })))
    } catch {
      setError('Error al cargar las reservas. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }, [user?.buildingId])

  useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date)
  }

  const handleSubmit = async () => {
    if (!user?.buildingId || !newReservation.area || !newReservation.date || !newReservation.startTime || !newReservation.endTime) return
    setSaving(true)
    setError(null)
    try {
      const start = new Date(`${newReservation.date}T${newReservation.startTime}`)
      const end = new Date(`${newReservation.date}T${newReservation.endTime}`)
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          area_id: newReservation.area,
          building_id: user.buildingId,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          notes: newReservation.notes || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'No se pudo crear la reserva', {
          description: data.error?.includes('horario') ? 'Ese horario ya está ocupado.' : undefined,
        })
        return
      }
      setDialogOpen(false)
      setNewReservation({ area: '', date: '', startTime: '', endTime: '', guests: '', notes: '' })
      toast.success('Reserva creada', {
        description: 'Recibirás confirmación del administrador.',
      })
      await fetchReservations()
    } catch {
      toast.error('Error de conexión', {
        description: 'No se pudo crear la reserva. Intenta de nuevo.',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancelReservation = async (id: string) => {
    try {
      const res = await fetch(`/api/reservations?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'No se pudo cancelar')
        return
      }
      toast.success('Reserva cancelada')
      await fetchReservations()
    } catch {
      toast.error('Error de conexión')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Reservas de Areas Comunes</h2>
          <p className="text-muted-foreground">Reserva espacios para tus eventos y actividades</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Reserva
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nueva Reserva</DialogTitle>
              <DialogDescription>
                Selecciona el area y el horario para tu reserva.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Area a Reservar</Label>
                <Select
                  value={newReservation.area}
                  onValueChange={(value) => setNewReservation({ ...newReservation, area: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un area" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(areaConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.name} {config.deposit > 0 && `(Deposito: ${formatCurrency(config.deposit)})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  value={newReservation.date}
                  onChange={(e) => setNewReservation({ ...newReservation, date: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Hora Inicio</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={newReservation.startTime}
                    onChange={(e) => setNewReservation({ ...newReservation, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">Hora Fin</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={newReservation.endTime}
                    onChange={(e) => setNewReservation({ ...newReservation, endTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="guests">Numero de Invitados</Label>
                <Input
                  id="guests"
                  type="number"
                  value={newReservation.guests}
                  onChange={(e) => setNewReservation({ ...newReservation, guests: e.target.value })}
                  placeholder="Cantidad aproximada"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  value={newReservation.notes}
                  onChange={(e) => setNewReservation({ ...newReservation, notes: e.target.value })}
                  placeholder="Descripcion del evento o notas adicionales"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>Enviar Solicitud</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Available Areas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(areaConfig).map(([key, config]) => {
          const Icon = config.icon
          return (
            <Card key={key} className="border-border bg-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{config.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      Max {config.maxGuests} personas, {config.maxHours}h
                    </p>
                  </div>
                </div>
                {config.deposit > 0 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Deposito requerido: {formatCurrency(config.deposit)}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* My Reservations */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Mis Reservas</CardTitle>
          <CardDescription>Reservas programadas y historial</CardDescription>
        </CardHeader>
        <CardContent>
          {reservations.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No tienes reservas programadas"
              description="Reserva el salón social, la zona BBQ, el gimnasio o la piscina para tu próximo evento."
              actionLabel="Hacer una reserva"
              onAction={() => setDialogOpen(true)}
              compact
            />
          ) : (
            <div className="space-y-4">
              {reservations.map((reservation) => {
                const area = areaConfig[reservation.area as keyof typeof areaConfig]
                const status = statusConfig[reservation.status]
                const Icon = area?.icon || Calendar

                return (
                  <div
                    key={reservation.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                        <Icon className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{area?.name || reservation.area}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(reservation.date)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <Clock className="mr-1 inline h-3 w-3" />
                          {reservation.startTime} - {reservation.endTime}
                          {reservation.guests && ` | ${reservation.guests} invitados`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={status.color}>{status.label}</Badge>
                      {reservation.status === 'pending' && (
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
