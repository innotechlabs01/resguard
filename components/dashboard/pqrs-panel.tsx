'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/lib/auth-context'
import {
  Ticket,
  Plus,
  Filter,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  User,
  Building2,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const categoryLabels: Record<string, string> = {
  maintenance: 'Mantenimiento',
  noise: 'Ruido',
  security: 'Seguridad',
  cleaning: 'Limpieza',
  parking: 'Parqueadero',
  common_areas: 'Areas Comunes',
  billing: 'Facturacion',
  other: 'Otro',
}

const categoryColors: Record<string, string> = {
  maintenance: 'bg-blue-100 text-blue-800',
  noise: 'bg-purple-100 text-purple-800',
  security: 'bg-red-100 text-red-800',
  cleaning: 'bg-green-100 text-green-800',
  parking: 'bg-yellow-100 text-yellow-800',
  common_areas: 'bg-indigo-100 text-indigo-800',
  billing: 'bg-orange-100 text-orange-800',
  other: 'bg-gray-100 text-gray-800',
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Baja', color: 'bg-gray-100 text-gray-800' },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  high: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
}

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  open: { label: 'Abierto', color: 'bg-yellow-100 text-yellow-800', icon: 'clock' },
  in_progress: { label: 'En Progreso', color: 'bg-blue-100 text-blue-800', icon: 'loader' },
  waiting: { label: 'En Espera', color: 'bg-orange-100 text-orange-800', icon: 'clock' },
  resolved: { label: 'Resuelto', color: 'bg-green-100 text-green-800', icon: 'check' },
  closed: { label: 'Cerrado', color: 'bg-gray-100 text-gray-800', icon: 'x' },
  reopened: { label: 'Reabierto', color: 'bg-red-100 text-red-800', icon: 'refresh' },
}

interface PqrsItem {
  id: string
  building_id: string
  created_by: string
  created_by_name: string
  created_by_unit: string | null
  subject: string
  description: string
  category: string
  priority: string
  status: string
  unit: string | null
  location_detail: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
  first_response_at: string | null
}

interface PqrsComment {
  id: string
  pqrs_id: string
  author_id: string
  author_name: string
  author_role: string
  content: string
  is_internal: boolean
  created_at: string
}

interface PqrsStats {
  total: number
  open: number
  in_progress: number
  resolved: number
  closed: number
  waiting: number
  reopened: number
  by_category: Record<string, number>
  by_priority: Record<string, number>
  avg_response_hours: number | null
}

interface PqrsEvent {
  id: string
  entity_type: string
  entity_id: string
  event_type: string
  actor_name: string | null
  old_value: string | null
  new_value: string | null
  note: string | null
  created_at: string
}

export interface ResidentOption {
  id: string
  name: string
  unit: string | null
}

const statusDisplayNames: Record<string, string> = {
  open: 'Abierto',
  in_progress: 'En progreso',
  waiting: 'En espera',
  resolved: 'Resuelto',
  closed: 'Cerrado',
  reopened: 'Reabierto',
}

function statusChangedLabel(event: PqrsEvent): string {
  const oldLabel = event.old_value ? (statusDisplayNames[event.old_value] || event.old_value) : ''
  const newLabel = event.new_value ? (statusDisplayNames[event.new_value] || event.new_value) : ''
  return `Estado cambiado de ${oldLabel} a ${newLabel}`
}

function eventLabel(event: PqrsEvent): string {
  switch (event.event_type) {
    case 'created':
      return 'Creado'
    case 'status_changed':
      return statusChangedLabel(event)
    case 'assigned':
      return event.new_value ? `Asignado a ${event.new_value}` : 'Asignado'
    case 'comment':
      return 'Comentario añadido'
    default:
      return event.event_type
  }
}

export function PqrsPanel({
  buildingId,
  residents,
  focusId,
  onFocusConsumed,
}: {
  buildingId: string
  residents?: ResidentOption[]
  focusId?: string | null
  onFocusConsumed?: () => void
}) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  const [pqrsList, setPqrsList] = useState<PqrsItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [stats, setStats] = useState<PqrsStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('open')
  const [selectedPqrs, setSelectedPqrs] = useState<PqrsItem | null>(null)
  const [comments, setComments] = useState<PqrsComment[]>([])
  const [events, setEvents] = useState<PqrsEvent[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [newComment, setNewComment] = useState('')
  const handledFocusRef = useRef<string | null>(null)

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    subject: '',
    description: '',
    category: 'maintenance',
    priority: 'normal',
    unit: user?.buildingId ? '' : '',
    location_detail: '',
  })
  const [creating, setCreating] = useState(false)

  // Filters for admin
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')

  // Fetch PQRS list
  const fetchPqrs = useCallback(async () => {
    try {
      const params = new URLSearchParams({ buildingId })
      if (activeTab !== 'all') params.set('status', activeTab)
      if (filterCategory !== 'all') params.set('category', filterCategory)
      if (filterPriority !== 'all') params.set('priority', filterPriority)
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))

      const res = await fetch(`/api/pqrs?${params}`)
      if (res.ok) {
        const data = await res.json()
        setPqrsList(data.pqrs || [])
        setTotal(data.total || 0)
      }
    } catch (err) {
      console.error('Error fetching PQRS:', err)
    } finally {
      setLoading(false)
    }
  }, [buildingId, activeTab, filterCategory, filterPriority, page, pageSize])

  // Fetch stats (admin only)
  const fetchStats = useCallback(async () => {
    if (!isAdmin) return
    try {
      const res = await fetch(`/api/pqrs/stats?buildingId=${buildingId}`)
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
      }
    } catch (err) {
      console.error('Error fetching PQRS stats:', err)
    }
  }, [buildingId, isAdmin])

  useEffect(() => { fetchPqrs() }, [fetchPqrs])
  useEffect(() => { fetchStats() }, [fetchStats])

  // Fetch detail
  const openDetail = async (pqrs: PqrsItem) => {
    setSelectedPqrs(pqrs)
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/pqrs/${pqrs.id}`)
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments || [])
        setEvents(data.events || [])
      }
    } catch (err) {
      console.error('Error fetching detail:', err)
    } finally {
      setLoadingDetail(false)
    }
  }

  // Open a specific PQRS detail when navigated from another panel (e.g. Inbox)
  useEffect(() => {
    if (!focusId || handledFocusRef.current === focusId) return
    handledFocusRef.current = focusId
    onFocusConsumed?.()
    setLoadingDetail(true)
    fetch(`/api/pqrs/${focusId}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.pqrs) {
          setSelectedPqrs(data.pqrs)
          setComments(data.comments || [])
          setEvents(data.events || [])
        }
      })
      .catch(err => console.error('Error fetching focused PQRS:', err))
      .finally(() => setLoadingDetail(false))
  }, [focusId])

  // Refetch comments + events for the open detail (keeps timeline fresh after admin actions)
  const reloadDetail = useCallback(async (pqrsId: string) => {
    try {
      const res = await fetch(`/api/pqrs/${pqrsId}`)
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments || [])
        setEvents(data.events || [])
      }
    } catch (err) {
      console.error('Error refreshing detail:', err)
    }
  }, [])

  // Create PQRS
  const handleCreate = async () => {
    if (!createForm.subject || !createForm.description) return
    setCreating(true)
    try {
      const res = await fetch('/api/pqrs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...createForm, building_id: buildingId }),
      })
      if (res.ok) {
        setCreateDialogOpen(false)
        setCreateForm({ subject: '', description: '', category: 'maintenance', priority: 'normal', unit: '', location_detail: '' })
        fetchPqrs()
        fetchStats()
      }
    } catch (err) {
      console.error('Error creating PQRS:', err)
    } finally {
      setCreating(false)
    }
  }

  // Add comment
  const handleAddComment = async () => {
    if (!selectedPqrs || !newComment.trim()) return
    try {
      const res = await fetch(`/api/pqrs/${selectedPqrs.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setComments(prev => [...prev, data.comment])
        setNewComment('')
        if (selectedPqrs) reloadDetail(selectedPqrs.id)
      }
    } catch (err) {
      console.error('Error adding comment:', err)
    }
  }

  // Update status (admin)
  const handleStatusChange = async (pqrsId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/pqrs/${pqrsId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        fetchPqrs()
        fetchStats()
        if (selectedPqrs?.id === pqrsId) {
          setSelectedPqrs(prev => prev ? { ...prev, status: newStatus } : null)
          reloadDetail(pqrsId)
        }
      }
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  // Assign (admin)
  const handleAssign = async (pqrsId: string, assignedTo: string) => {
    try {
      const res = await fetch(`/api/pqrs/${pqrsId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: assignedTo }),
      })
      if (res.ok) {
        fetchPqrs()
        if (selectedPqrs?.id === pqrsId) {
          setSelectedPqrs(prev => prev ? { ...prev, assigned_to: assignedTo } : null)
          reloadDetail(pqrsId)
        }
      }
    } catch (err) {
      console.error('Error assigning:', err)
    }
  }

  // Detail view
  if (selectedPqrs) {
    return (
      <PqrsDetail
        pqrs={selectedPqrs}
        comments={comments}
        events={events}
        loading={loadingDetail}
        isAdmin={isAdmin}
        residents={residents}
        newComment={newComment}
        onCommentChange={setNewComment}
        onAddComment={handleAddComment}
        onStatusChange={handleStatusChange}
        onAssign={handleAssign}
        onBack={() => { setSelectedPqrs(null); setComments([]); setEvents([]); fetchPqrs(); fetchStats(); }}
      />
    )
  }

  // Tabs
  const tabs = isAdmin
    ? [
        { id: 'open', label: 'Abiertos', count: stats?.open || 0 },
        { id: 'in_progress', label: 'En Progreso', count: stats?.in_progress || 0 },
        { id: 'resolved', label: 'Resueltos', count: stats?.resolved || 0 },
        { id: 'all', label: 'Todos', count: stats?.total || 0 },
      ]
    : [
        { id: 'open', label: 'Abiertos' },
        { id: 'in_progress', label: 'En Progreso' },
        { id: 'resolved', label: 'Resueltos' },
        { id: 'all', label: 'Todos' },
      ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ticket className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">PQRS</h2>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo
        </Button>
      </div>

      {/* Stats cards (admin only) */}
      {isAdmin && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-muted-foreground">Abiertos</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-yellow-600">{stats.open}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">En Progreso</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-blue-600">{stats.in_progress}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Resueltos</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-green-600">{stats.resolved}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      {isAdmin && (
        <div className="flex gap-3">
          <Select value={filterCategory} onValueChange={v => { setFilterCategory(v); setPage(1) }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorias</SelectItem>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={v => { setFilterPriority(v); setPage(1) }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las prioridades</SelectItem>
              {Object.entries(priorityConfig).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setPage(1) }}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {'count' in tab && tab.count !== undefined && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {tab.count}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* PQRS list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : pqrsList.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay PQRS en esta categoria</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pqrsList.map(pqrs => (
            <Card
              key={pqrs.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => openDetail(pqrs)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{pqrs.subject}</h3>
                      <Badge className={categoryColors[pqrs.category] || 'bg-gray-100 text-gray-800'}>
                        {categoryLabels[pqrs.category] || pqrs.category}
                      </Badge>
                      <Badge className={priorityConfig[pqrs.priority]?.color || 'bg-gray-100 text-gray-800'}>
                        {priorityConfig[pqrs.priority]?.label || pqrs.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{pqrs.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {pqrs.created_by_name}
                      </span>
                      {pqrs.unit && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {pqrs.unit}
                        </span>
                      )}
                      <span>{new Date(pqrs.created_at).toLocaleDateString('es-CO')}</span>
                      {pqrs.assigned_to && (
                        <span className="text-blue-600">Asignado: {pqrs.assigned_to}</span>
                      )}
                    </div>
                  </div>
                  <Badge className={statusConfig[pqrs.status]?.color || 'bg-gray-100 text-gray-800'}>
                    {statusConfig[pqrs.status]?.label || pqrs.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {/* Pagination footer */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">{total} registros</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Página {page} de {Math.max(1, Math.ceil(total / pageSize))}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= Math.max(1, Math.ceil(total / pageSize))}
                onClick={() => setPage(p => p + 1)}
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Crear PQRS</DialogTitle>
            <DialogDescription>Registra una peticion, queja, reclamo o sugerencia</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Asunto *</label>
              <Input
                value={createForm.subject}
                onChange={e => setCreateForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Ej: Fuga en el techo del salon"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Descripcion *</label>
              <Textarea
                value={createForm.description}
                onChange={e => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe el problema o solicitud en detalle..."
                rows={4}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Categoria *</label>
                <Select
                  value={createForm.category}
                  onValueChange={v => setCreateForm(prev => ({ ...prev, category: v }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Prioridad</label>
                <Select
                  value={createForm.priority}
                  onValueChange={v => setCreateForm(prev => ({ ...prev, priority: v }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityConfig).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Unidad</label>
                <Input
                  value={createForm.unit}
                  onChange={e => setCreateForm(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="Ej: 301"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Ubicacion</label>
                <Input
                  value={createForm.location_detail}
                  onChange={e => setCreateForm(prev => ({ ...prev, location_detail: e.target.value }))}
                  placeholder="Ej: Tercer piso"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating || !createForm.subject || !createForm.description}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Detail View ──

function PqrsDetail({
  pqrs,
  comments,
  events,
  loading,
  isAdmin,
  newComment,
  onCommentChange,
  onAddComment,
  onStatusChange,
  onAssign,
  onBack,
  residents,
}: {
  pqrs: PqrsItem
  comments: PqrsComment[]
  events: PqrsEvent[]
  loading: boolean
  isAdmin: boolean
  newComment: string
  onCommentChange: (v: string) => void
  onAddComment: () => void
  onStatusChange: (id: string, status: string) => void
  onAssign: (id: string, assignedTo: string) => void
  onBack: () => void
  residents?: ResidentOption[]
}) {
  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Button>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{pqrs.subject}</CardTitle>
              <CardDescription className="mt-1">
                Creado por {pqrs.created_by_name} el {new Date(pqrs.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={categoryColors[pqrs.category] || 'bg-gray-100 text-gray-800'}>
                {categoryLabels[pqrs.category]}
              </Badge>
              <Badge className={priorityConfig[pqrs.priority]?.color || 'bg-gray-100 text-gray-800'}>
                {priorityConfig[pqrs.priority]?.label}
              </Badge>
              <Badge className={statusConfig[pqrs.status]?.color || 'bg-gray-100 text-gray-800'}>
                {statusConfig[pqrs.status]?.label}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-foreground whitespace-pre-wrap">{pqrs.description}</p>
          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            {pqrs.unit && <span>Unidad: {pqrs.unit}</span>}
            {pqrs.location_detail && <span>Ubicacion: {pqrs.location_detail}</span>}
            {pqrs.assigned_to && <span>Asignado a: {pqrs.assigned_to}</span>}
          </div>
        </CardContent>
      </Card>

      {/* Admin controls */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Administrar</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3 flex-wrap">
            <Select value={pqrs.status} onValueChange={v => onStatusChange(pqrs.id, v)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusConfig).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {residents && residents.length > 0 ? (
              <Select value={pqrs.assigned_to || ''} onValueChange={v => onAssign(pqrs.id, v)}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Asignar a..." />
                </SelectTrigger>
                <SelectContent>
                  {residents.map(r => (
                    <SelectItem key={r.id} value={r.name}>
                      {r.unit ? `Unidad ${r.unit} — ${r.name}` : r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder="Asignar a..."
                defaultValue={pqrs.assigned_to || ''}
                onBlur={e => onAssign(pqrs.id, e.target.value)}
                className="w-64"
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Timeline / Historial */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sin eventos registrados</p>
          ) : (
            <ol className="relative border-l border-border space-y-4">
              {events.map(event => (
                <li key={event.id} className="ml-4">
                  <span className="absolute -left-1.5 mt-1.5 h-2 w-2 rounded-full bg-muted-foreground/40" />
                  <div className="space-y-0.5">
                    <p className="text-sm text-foreground">{eventLabel(event)}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.actor_name ? `${event.actor_name} · ` : ''}
                      {new Date(event.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comentarios ({comments.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No hay comentarios aun</p>
          ) : (
            <div className="space-y-3">
              {comments.map(comment => (
                <div
                  key={comment.id}
                  className={`p-3 rounded-lg ${
                    comment.is_internal ? 'bg-yellow-50 border border-yellow-200' : 'bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">{comment.author_name}</span>
                    <Badge variant="outline" className="text-xs">{comment.author_role}</Badge>
                    {comment.is_internal && <Badge variant="secondary" className="text-xs">Interno</Badge>}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(comment.created_at).toLocaleDateString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{comment.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add comment */}
          <div className="flex gap-2 mt-4">
            <Textarea
              value={newComment}
              onChange={e => onCommentChange(e.target.value)}
              placeholder="Escribe un comentario..."
              rows={2}
              className="flex-1"
            />
            <Button onClick={onAddComment} disabled={!newComment.trim()} className="self-end">
              Enviar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
