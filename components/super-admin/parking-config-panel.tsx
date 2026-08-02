'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Car, 
  Clock, 
  DollarSign, 
  Settings, 
  Plus, 
  Edit, 
  Trash2,
  Save,
  Building2,
  Users,
} from 'lucide-react'

interface ParkingConfig {
  id: string
  buildingId: string
  buildingName: string
  visitorSpots: number
  residentSpots: number
  freeMinutes: number
  hourlyRate: number
  overtimeMultiplier: number
  maxOvertimeHours: number
  allowReservations: boolean
  reservationHours: number
}

export function ParkingConfigPanel() {
  const { user, isAuthenticated, isDemoMode, isLoaded } = useAuth()
  const [configs, setConfigs] = useState<ParkingConfig[]>([])
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedConfig, setSelectedConfig] = useState<ParkingConfig | null>(null)
  const [editForm, setEditForm] = useState<ParkingConfig | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !isLoaded) return
    fetch('/api/buildings')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setConfigs(data.map((b: { id: string; name: string; visitor_parking_spots?: number; total_parking_spots?: number; }) => ({
            id: b.id,
            buildingId: b.id,
            buildingName: b.name,
            visitorSpots: b.visitor_parking_spots || 0,
            residentSpots: (b.total_parking_spots || 0) - (b.visitor_parking_spots || 0),
            freeMinutes: 60,
            hourlyRate: 1500,
            overtimeMultiplier: 1.5,
            maxOvertimeHours: 3,
            allowReservations: true,
            reservationHours: 24,
          })))
        }
      })
      .catch(() => setConfigs([]))
  }, [isAuthenticated, isLoaded])

  const handleEdit = (config: ParkingConfig) => {
    setSelectedConfig(config)
    setEditForm({ ...config })
    setEditDialogOpen(true)
  }

  const handleSave = () => {
    if (!editForm) return
    setConfigs(configs.map(c => c.id === editForm.id ? editForm : c))
    setEditDialogOpen(false)
  }

  const totalVisitorSpots = configs.reduce((sum, c) => sum + c.visitorSpots, 0)
  const totalResidentSpots = configs.reduce((sum, c) => sum + c.residentSpots, 0)

  if (!isLoaded) {
    return (
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-card border-border">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isDemoMode || !user) {
    return (
      <div className="space-y-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              Modo Demo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Inicia sesion con tu cuenta para ver la configuracion de parqueaderos.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Settings className="h-4 w-4" />
              <span>Acceso restringido a usuarios autenticados</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Configuracion de Parqueaderos</h2>
          <p className="text-sm text-muted-foreground">Administra las tarifas y reglas de parqueo por edificio</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Edificios Configurados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">{configs.length}</div>
            <p className="text-xs text-muted-foreground">con parqueaderos</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cupos Visitantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-primary">{totalVisitorSpots}</div>
            <p className="text-xs text-muted-foreground">disponibles</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cupos Residentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-info">{totalResidentSpots}</div>
            <p className="text-xs text-muted-foreground">asignables</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tarifa Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              ${Math.round(configs.reduce((sum, c) => sum + c.hourlyRate, 0) / configs.length).toLocaleString()}/hr
            </div>
            <p className="text-xs text-muted-foreground">por hora</p>
          </CardContent>
        </Card>
      </div>

      {/* Config List */}
      <div className="grid gap-4">
        {configs.map((config) => (
          <Card key={config.id} className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-foreground">{config.buildingName}</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      ID: {config.buildingId}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                    <Car className="mr-1 h-3 w-3" />
                    {config.visitorSpots} visitantes
                  </Badge>
                  <Badge variant="outline" className="bg-info/10 text-info border-info/30">
                    <Users className="mr-1 h-3 w-3" />
                    {config.residentSpots} residentes
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(config)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Tiempo libre</p>
                  <p className="font-medium text-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {config.freeMinutes} min
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Tarifa hora</p>
                  <p className="font-medium text-foreground flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    ${config.hourlyRate.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Multa tiempo extra</p>
                  <p className="font-medium text-foreground">
                    {config.overtimeMultiplier}x
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Max tiempo extra</p>
                  <p className="font-medium text-foreground">
                    {config.maxOvertimeHours} horas
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Reservas</p>
                  <p className="font-medium text-foreground">
                    {config.allowReservations ? `${config.reservationHours}h` : 'No'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">Configurar Parqueadero</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Edita las reglas y tarifas de parqueo para {selectedConfig?.buildingName}
            </DialogDescription>
          </DialogHeader>
          
          {editForm && (
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="w-full bg-muted">
                <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
                <TabsTrigger value="rates" className="flex-1">Tarifas</TabsTrigger>
                <TabsTrigger value="reservations" className="flex-1">Reservas</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cupos visitantes</Label>
                    <Input 
                      type="number"
                      value={editForm.visitorSpots}
                      onChange={(e) => setEditForm({...editForm, visitorSpots: parseInt(e.target.value) || 0})}
                      className="bg-input border-border text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cupos residentes</Label>
                    <Input 
                      type="number"
                      value={editForm.residentSpots}
                      onChange={(e) => setEditForm({...editForm, residentSpots: parseInt(e.target.value) || 0})}
                      className="bg-input border-border text-foreground"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="rates" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Minutos gratis</Label>
                    <Input 
                      type="number"
                      value={editForm.freeMinutes}
                      onChange={(e) => setEditForm({...editForm, freeMinutes: parseInt(e.target.value) || 0})}
                      className="bg-input border-border text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tarifa por hora (COP)</Label>
                    <Input 
                      type="number"
                      value={editForm.hourlyRate}
                      onChange={(e) => setEditForm({...editForm, hourlyRate: parseInt(e.target.value) || 0})}
                      className="bg-input border-border text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Multiplicador tiempo extra</Label>
                    <Input 
                      type="number"
                      step="0.5"
                      value={editForm.overtimeMultiplier}
                      onChange={(e) => setEditForm({...editForm, overtimeMultiplier: parseFloat(e.target.value) || 1})}
                      className="bg-input border-border text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Horas maximas tiempo extra</Label>
                    <Input 
                      type="number"
                      value={editForm.maxOvertimeHours}
                      onChange={(e) => setEditForm({...editForm, maxOvertimeHours: parseInt(e.target.value) || 0})}
                      className="bg-input border-border text-foreground"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="reservations" className="space-y-4 mt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allowReservations"
                    checked={editForm.allowReservations}
                    onCheckedChange={(checked) => setEditForm({...editForm, allowReservations: checked === true})}
                  />
                  <label
                    htmlFor="allowReservations"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground"
                  >
                    Permitir reservas de parqueadero
                  </label>
                </div>
                {editForm.allowReservations && (
                  <div className="space-y-2">
                    <Label>Horas de anticipacion para reserva</Label>
                    <Input 
                      type="number"
                      value={editForm.reservationHours}
                      onChange={(e) => setEditForm({...editForm, reservationHours: parseInt(e.target.value) || 0})}
                      className="bg-input border-border text-foreground"
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
