'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { 
  Phone, 
  PhoneCall, 
  Package, 
  User, 
  Building2, 
  Home, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Send,
  Bell,
  Search
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface IntercomUnit {
  id: string
  building_id: string
  unit_number: string
  owner_id: string | null
  owner_name: string | null
  owner_phone: string | null
  tenant_name: string | null
  tenant_phone: string | null
}

interface IntercomCall {
  id: string
  building_id: string
  unit_id: string
  unit_number: string
  caller_type: string
  caller_name: string | null
  caller_message: string | null
  status: string
  created_at: string
  responded_at: string | null
}

const callerTypeConfig: Record<string, { icon: any; label: string; className: string }> = {
  visitor: { icon: User, label: 'Visitante', className: 'bg-primary/10 text-primary' },
  delivery: { icon: Package, label: 'Reparto', className: 'bg-info/10 text-info' },
  other: { icon: Phone, label: 'Otro', className: 'bg-muted text-muted-foreground' },
}

const statusConfig: Record<string, { icon: any; label: string; className: string }> = {
  pending: { icon: Clock, label: 'Pendiente', className: 'bg-warning/10 text-warning' },
  approved: { icon: CheckCircle2, label: 'Aprobado', className: 'bg-success/10 text-success' },
  rejected: { icon: XCircle, label: 'Rechazado', className: 'bg-destructive/10 text-destructive' },
  expired: { icon: XCircle, label: 'Expirado', className: 'bg-muted text-muted-foreground' },
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 60000)
  
  if (diff < 1) return 'Ahora'
  if (diff < 60) return `Hace ${diff} min`
  if (diff < 1440) return `Hace ${Math.floor(diff / 60)}h`
  return formatTime(dateStr)
}

export function IntercomPanel() {
  const { user } = useAuth()
  const [units, setUnits] = useState<IntercomUnit[]>([])
  const [calls, setCalls] = useState<IntercomCall[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUnit, setSelectedUnit] = useState<IntercomUnit | null>(null)
  const [callDialogOpen, setCallDialogOpen] = useState(false)
  const [callHistoryOpen, setCallHistoryOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [callerInfo, setCallerInfo] = useState({
    type: 'visitor' as 'visitor' | 'delivery' | 'other',
    name: '',
    message: '',
  })

  useEffect(() => {
    if (user?.buildingId) {
      fetchData()
    }
  }, [user?.buildingId])

  const fetchData = async () => {
    if (!user?.buildingId) return
    try {
      const [unitsRes, callsRes] = await Promise.all([
        fetch(`/api/intercom?buildingId=${user.buildingId}`),
        fetch(`/api/intercom?buildingId=${user.buildingId}&type=calls`),
      ])
      const unitsData = await unitsRes.json()
      const callsData = await callsRes.json()
      setUnits(unitsData.units || [])
      setCalls(callsData.calls || [])
    } catch (error) {
      console.error('Error fetching intercom data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCallUnit = (unit: IntercomUnit) => {
    setSelectedUnit(unit)
    setCallDialogOpen(true)
    setCallerInfo({ type: 'visitor', name: '', message: '' })
  }

  const initiateCall = async () => {
    if (!user?.buildingId || !selectedUnit) return
    
    try {
      await fetch('/api/intercom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildingId: user.buildingId,
          unitId: selectedUnit.id,
          unitNumber: selectedUnit.unit_number,
          callerType: callerInfo.type,
          callerName: callerInfo.name || undefined,
          callerMessage: callerInfo.message || undefined,
        }),
      })
      
      setCallDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error initiating call:', error)
    }
  }

  const pendingCalls = calls.filter(c => c.status === 'pending')
  const filteredUnits = units.filter(u => 
    u.unit_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.owner_name && u.owner_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.tenant_name && u.tenant_name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Citofono</h2>
          <p className="text-sm text-muted-foreground">Gestion de llamadas del citofono</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setCallHistoryOpen(true)}>
          <Clock className="mr-2 h-4 w-4" />
          Historial ({calls.length})
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Apartamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">{units.length}</div>
            <p className="text-xs text-muted-foreground">Unidades registradas</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Llamadas Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-warning">{pendingCalls.length}</div>
            <p className="text-xs text-muted-foreground">Esperando respuesta</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-foreground">{calls.length}</div>
            <p className="text-xs text-muted-foreground">Total llamadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Calls Alert */}
      {pendingCalls.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-warning flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Llamadas Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingCalls.slice(0, 3).map(call => {
                const callerType = callerTypeConfig[call.caller_type] || callerTypeConfig.other
                const CallerIcon = callerType.icon
                return (
                  <div key={call.id} className="flex items-center justify-between bg-background/50 p-2 rounded">
                    <div className="flex items-center gap-2">
                      <CallerIcon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-sm font-medium text-foreground">Apartamento {call.unit_number}</span>
                        <span className="text-xs text-muted-foreground ml-2">- {call.caller_name || callerType.label}</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatTimeAgo(call.created_at)}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por apartamento, propietario o inquilino..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-input border-border text-foreground"
        />
      </div>

      {/* Units Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredUnits.map(unit => (
          <Card key={unit.id} className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer" onClick={() => handleCallUnit(unit)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Home className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">Apartamento {unit.unit_number}</p>
                  {unit.tenant_name ? (
                    <p className="text-xs text-muted-foreground truncate">{unit.tenant_name}</p>
                  ) : unit.owner_name ? (
                    <p className="text-xs text-muted-foreground truncate">{unit.owner_name}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Sin registro</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUnits.length === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {searchQuery ? 'No se encontraron apartamentos' : 'No hay apartamentos registrados'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Call Dialog */}
      <Dialog open={callDialogOpen} onOpenChange={setCallDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Llamar a Apartamento {selectedUnit?.unit_number}</DialogTitle>
            <DialogDescription>
              Ingresa la información del visitante
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Tipo de Visita</label>
              <div className="flex gap-2">
                {(['visitor', 'delivery', 'other'] as const).map(type => (
                  <Button
                    key={type}
                    variant={callerInfo.type === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCallerInfo({ ...callerInfo, type })}
                    className="flex-1"
                  >
                    {type === 'visitor' && <User className="mr-1 h-4 w-4" />}
                    {type === 'delivery' && <Package className="mr-1 h-4 w-4" />}
                    {type === 'other' && <Phone className="mr-1 h-4 w-4" />}
                    {callerTypeConfig[type].label}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Nombre del Visitante</label>
              <Input
                value={callerInfo.name}
                onChange={(e) => setCallerInfo({ ...callerInfo, name: e.target.value })}
                placeholder="Ingresa el nombre"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Mensaje (opcional)</label>
              <Input
                value={callerInfo.message}
                onChange={(e) => setCallerInfo({ ...callerInfo, message: e.target.value })}
                placeholder="Mensaje para el residente"
              />
            </div>
            
            {selectedUnit && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Notificar a:</p>
                {selectedUnit.tenant_name && (
                  <p className="font-medium text-foreground">{selectedUnit.tenant_name} ({selectedUnit.tenant_phone})</p>
                )}
                {selectedUnit.owner_name && (
                  <p className="font-medium text-foreground">{selectedUnit.owner_name} ({selectedUnit.owner_phone})</p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCallDialogOpen(false)}>Cancelar</Button>
            <Button onClick={initiateCall}>
              <Send className="mr-2 h-4 w-4" />
              Llamar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Call History Dialog */}
      <Dialog open={callHistoryOpen} onOpenChange={setCallHistoryOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Historial de Llamadas</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {calls.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay llamadas registradas</p>
            ) : (
              calls.map(call => {
                const status = statusConfig[call.status] || statusConfig.pending
                const StatusIcon = status.icon
                const callerType = callerTypeConfig[call.caller_type] || callerTypeConfig.other
                const CallerIcon = callerType.icon
                
                return (
                  <div key={call.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CallerIcon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Apartamento {call.unit_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {call.caller_name || callerType.label}
                          {call.caller_message && ` - "${call.caller_message}"`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={status.className}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {status.label}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(call.created_at)}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}