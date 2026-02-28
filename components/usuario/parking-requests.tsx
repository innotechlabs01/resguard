'use client'

import { useState } from 'react'
import {
  Car,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

interface ParkingRequest {
  id: string
  visitorName: string
  vehiclePlate: string
  date: Date
  duration: number
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  spotAssigned?: string
}

const mockRequests: ParkingRequest[] = [
  {
    id: '1',
    visitorName: 'Juan Perez',
    vehiclePlate: 'ABC-123',
    date: new Date(),
    duration: 2,
    status: 'approved',
    spotAssigned: 'V-02',
  },
  {
    id: '2',
    visitorName: 'Maria Garcia',
    vehiclePlate: 'XYZ-789',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000),
    duration: 3,
    status: 'pending',
  },
  {
    id: '3',
    visitorName: 'Carlos Lopez',
    vehiclePlate: 'DEF-456',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    duration: 2,
    status: 'completed',
    spotAssigned: 'V-05',
  },
]

const statusConfig = {
  pending: { label: 'Pendiente', icon: Clock, color: 'text-warning bg-warning/10' },
  approved: { label: 'Aprobado', icon: CheckCircle, color: 'text-success bg-success/10' },
  rejected: { label: 'Rechazado', icon: XCircle, color: 'text-destructive bg-destructive/10' },
  completed: { label: 'Completado', icon: CheckCircle, color: 'text-muted-foreground bg-muted' },
}

export function ParkingRequests() {
  const [requests, setRequests] = useState<ParkingRequest[]>(mockRequests)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newRequest, setNewRequest] = useState({
    visitorName: '',
    vehiclePlate: '',
    date: '',
    time: '',
    duration: '2',
  })

  const handleSubmit = () => {
    const request: ParkingRequest = {
      id: Date.now().toString(),
      visitorName: newRequest.visitorName,
      vehiclePlate: newRequest.vehiclePlate,
      date: new Date(`${newRequest.date}T${newRequest.time}`),
      duration: Number.parseInt(newRequest.duration),
      status: 'pending',
    }
    setRequests([request, ...requests])
    setDialogOpen(false)
    setNewRequest({ visitorName: '', vehiclePlate: '', date: '', time: '', duration: '2' })
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-CO', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Parqueadero de Visitantes</h2>
          <p className="text-muted-foreground">Solicita cupos para tus visitantes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Solicitud
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Solicitar Parqueadero</DialogTitle>
              <DialogDescription>
                Registra los datos del visitante para reservar un cupo de parqueadero.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="visitorName">Nombre del Visitante</Label>
                <Input
                  id="visitorName"
                  value={newRequest.visitorName}
                  onChange={(e) => setNewRequest({ ...newRequest, visitorName: e.target.value })}
                  placeholder="Nombre completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehiclePlate">Placa del Vehiculo</Label>
                <Input
                  id="vehiclePlate"
                  value={newRequest.vehiclePlate}
                  onChange={(e) => setNewRequest({ ...newRequest, vehiclePlate: e.target.value.toUpperCase() })}
                  placeholder="ABC-123"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newRequest.date}
                    onChange={(e) => setNewRequest({ ...newRequest, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Hora</Label>
                  <Input
                    id="time"
                    type="time"
                    value={newRequest.time}
                    onChange={(e) => setNewRequest({ ...newRequest, time: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duracion Estimada</Label>
                <Select
                  value={newRequest.duration}
                  onValueChange={(value) => setNewRequest({ ...newRequest, duration: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona duracion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hora</SelectItem>
                    <SelectItem value="2">2 horas</SelectItem>
                    <SelectItem value="3">3 horas</SelectItem>
                    <SelectItem value="4">4 horas</SelectItem>
                  </SelectContent>
                </Select>
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

      {/* Info Card */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex items-start gap-4 pt-6">
          <AlertCircle className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <h4 className="font-medium text-foreground">Informacion Importante</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              El tiempo maximo de parqueadero para visitantes es de 2 horas gratuitas. Despues de este tiempo se cobrara $5,000 COP por cada 30 minutos adicionales.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Mis Solicitudes</CardTitle>
          <CardDescription>Historial de solicitudes de parqueadero</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.map((request) => {
              const status = statusConfig[request.status]
              const StatusIcon = status.icon
              
              return (
                <div
                  key={request.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                      <Car className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{request.visitorName}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.vehiclePlate} - {formatDate(request.date)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Duracion: {request.duration} horas
                        {request.spotAssigned && ` - Cupo: ${request.spotAssigned}`}
                      </p>
                    </div>
                  </div>
                  <Badge className={status.color}>
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {status.label}
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
