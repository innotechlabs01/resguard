'use client'

import { useState } from 'react'
import {
  Send,
  Plus,
  Bell,
  Megaphone,
  Wrench,
  Calendar,
  AlertTriangle,
  FileText,
  Users,
  Clock,
  CheckCheck,
  ChevronDown,
  Eye,
  Search,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { mockCommunications } from '@/lib/mock-data'
import type { Communication } from '@/lib/types'

const typeConfig: Record<
  Communication['type'],
  { label: string; icon: typeof Bell; className: string; bgClass: string }
> = {
  announcement: { label: 'Anuncio', icon: Megaphone, className: 'text-primary border-primary/20 bg-primary/10', bgClass: 'bg-primary/5' },
  maintenance: { label: 'Mantenimiento', icon: Wrench, className: 'text-warning border-warning/20 bg-warning/10', bgClass: 'bg-warning/5' },
  alert: { label: 'Alerta', icon: AlertTriangle, className: 'text-destructive border-destructive/20 bg-destructive/10', bgClass: 'bg-destructive/5' },
  event: { label: 'Evento', icon: Calendar, className: 'text-success border-success/20 bg-success/10', bgClass: 'bg-success/5' },
  circular: { label: 'Circular', icon: FileText, className: 'text-info border-info/20 bg-info/10', bgClass: 'bg-info/5' },
}

const priorityConfig: Record<Communication['priority'], { label: string; className: string }> = {
  low: { label: 'Baja', className: 'text-muted-foreground bg-muted' },
  normal: { label: 'Normal', className: 'text-info bg-info/10' },
  high: { label: 'Alta', className: 'text-warning bg-warning/10' },
  urgent: { label: 'Urgente', className: 'text-destructive bg-destructive/10' },
}

function formatRelativeTime(date: Date) {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `Hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Hace ${hrs}h`
  return `Hace ${Math.floor(hrs / 24)} dias`
}

export function ComunicacionesPanel() {
  const [communications, setCommunications] = useState<Communication[]>(mockCommunications)
  const [showCompose, setShowCompose] = useState(false)
  const [viewComm, setViewComm] = useState<Communication | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<Communication['type'] | 'all'>('all')
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'announcement' as Communication['type'],
    priority: 'normal' as Communication['priority'],
    includesTenants: true,
    targetResidents: true,
    targetVigilantes: false,
  })

  const filtered = communications.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.message.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || c.type === typeFilter
    return matchSearch && matchType
  })

  const handleSend = () => {
    if (!form.title || !form.message) return
    const roles: Communication['targetRoles'] = []
    if (form.targetResidents) roles.push('usuario')
    if (form.targetVigilantes) roles.push('vigilante')

    const comm: Communication = {
      id: `comm-${Date.now()}`,
      buildingId: 'building-1',
      authorId: 'admin-1',
      authorName: 'Maria Torres',
      title: form.title,
      message: form.message,
      type: form.type,
      priority: form.priority,
      targetRoles: roles,
      includesTenants: form.includesTenants,
      sentAt: new Date(),
      readBy: [],
    }
    setCommunications((prev) => [comm, ...prev])
    setForm({
      title: '',
      message: '',
      type: 'announcement',
      priority: 'normal',
      includesTenants: true,
      targetResidents: true,
      targetVigilantes: false,
    })
    setShowCompose(false)
  }

  const totalResidents = 115
  const totalWithTenants = 130

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Enviadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{communications.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Todas las comunicaciones</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sin Leer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {communications.filter((c) => c.readBy.length === 0).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Pendientes de apertura</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Residentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalResidents}</div>
            <p className="text-xs text-muted-foreground mt-1">Propietarios activos</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Incl. Inquilinos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{totalWithTenants}</div>
            <p className="text-xs text-muted-foreground mt-1">Total destinatarios</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar comunicacion..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-input border-border text-foreground"
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
            <SelectTrigger className="w-44 bg-input border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {Object.entries(typeConfig).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowCompose(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Comunicacion
        </Button>
      </div>

      {/* Communications list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Megaphone className="h-10 w-10 mb-3 opacity-30" />
            <p>No hay comunicaciones</p>
          </div>
        )}
        {filtered.map((comm) => {
          const typeCfg = typeConfig[comm.type]
          const TypeIcon = typeCfg.icon
          const prioCfg = priorityConfig[comm.priority]
          const readPct = Math.round((comm.readBy.length / totalResidents) * 100)

          return (
            <Card
              key={comm.id}
              className={cn(
                'bg-card border-border cursor-pointer hover:bg-muted/30 transition-colors',
                typeCfg.bgClass
              )}
              onClick={() => setViewComm(comm)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border', typeCfg.className)}>
                    <TypeIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-foreground text-sm truncate">{comm.title}</span>
                      <Badge variant="outline" className={cn('text-xs', typeCfg.className)}>
                        {typeCfg.label}
                      </Badge>
                      <Badge variant="secondary" className={cn('text-xs', prioCfg.className)}>
                        {prioCfg.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{comm.message}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(comm.sentAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {comm.includesTenants ? 'Res. + Inquilinos' : 'Solo residentes'}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCheck className="h-3 w-3 text-primary" />
                        {readPct}% leido
                      </span>
                    </div>
                  </div>
                  <Eye className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Compose Dialog */}
      <Dialog open={showCompose} onOpenChange={setShowCompose}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">Nueva comunicacion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm">Tipo *</Label>
                <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v as Communication['type'] }))}>
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeConfig).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm">Prioridad *</Label>
                <Select value={form.priority} onValueChange={(v) => setForm((p) => ({ ...p, priority: v as Communication['priority'] }))}>
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityConfig).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Asunto *</Label>
              <Input
                placeholder="Titulo de la comunicacion"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="bg-input border-border text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Mensaje *</Label>
              <Textarea
                placeholder="Escribe el mensaje para los residentes..."
                value={form.message}
                onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                className="bg-input border-border text-foreground min-h-[120px] resize-none"
              />
            </div>
            <Separator className="bg-border" />
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Destinatarios</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">Residentes propietarios</p>
                  <p className="text-xs text-muted-foreground">{totalResidents} personas</p>
                </div>
                <Switch
                  checked={form.targetResidents}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, targetResidents: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">Incluir inquilinos</p>
                  <p className="text-xs text-muted-foreground">Arrendatarios registrados en el sistema</p>
                </div>
                <Switch
                  checked={form.includesTenants}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, includesTenants: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">Vigilantes</p>
                  <p className="text-xs text-muted-foreground">Personal de seguridad del edificio</p>
                </div>
                <Switch
                  checked={form.targetVigilantes}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, targetVigilantes: v }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompose(false)}>Cancelar</Button>
            <Button onClick={handleSend} disabled={!form.title || !form.message}>
              <Send className="mr-2 h-4 w-4" />
              Enviar notificacion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Communication Dialog */}
      {viewComm && (
        <Dialog open={!!viewComm} onOpenChange={() => setViewComm(null)}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                {(() => {
                  const cfg = typeConfig[viewComm.type]
                  const Icon = cfg.icon
                  return (
                    <>
                      <span className={cn('flex h-7 w-7 items-center justify-center rounded-md border', cfg.className)}>
                        <Icon className="h-4 w-4" />
                      </span>
                      {viewComm.title}
                    </>
                  )
                })()}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className={typeConfig[viewComm.type].className}>
                  {typeConfig[viewComm.type].label}
                </Badge>
                <Badge variant="secondary" className={priorityConfig[viewComm.priority].className}>
                  {priorityConfig[viewComm.priority].label}
                </Badge>
                {viewComm.includesTenants && (
                  <Badge variant="outline" className="text-success border-success/20 bg-success/10">
                    Incluye inquilinos
                  </Badge>
                )}
              </div>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{viewComm.message}</p>
              <Separator className="bg-border" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatRelativeTime(viewComm.sentAt)} · {viewComm.authorName}
                </span>
                <span className="flex items-center gap-1">
                  <CheckCheck className="h-3.5 w-3.5 text-primary" />
                  Leido por {viewComm.readBy.length} personas
                </span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewComm(null)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
