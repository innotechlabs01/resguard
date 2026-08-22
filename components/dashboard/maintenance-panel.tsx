'use client'

import { useState, useEffect, useCallback } from 'react'
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
import {
  Wrench,
  Plus,
  Calendar,
  ClipboardList,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Trash2,
  DollarSign,
  Phone,
} from 'lucide-react'

// ── Config maps ──

const categoryLabels: Record<string, string> = {
  elevator: 'Ascensor',
  plumbing: 'Plomeria',
  electrical: 'Electrico',
  painting: 'Pintura',
  gardening: 'Jardineria',
  cleaning: 'Limpieza',
  security_system: 'Seguridad',
  other: 'Otro',
}

const categoryColors: Record<string, string> = {
  elevator: 'bg-purple-100 text-purple-800',
  plumbing: 'bg-blue-100 text-blue-800',
  electrical: 'bg-yellow-100 text-yellow-800',
  painting: 'bg-pink-100 text-pink-800',
  gardening: 'bg-green-100 text-green-800',
  cleaning: 'bg-teal-100 text-teal-800',
  security_system: 'bg-red-100 text-red-800',
  other: 'bg-gray-100 text-gray-800',
}

const frequencyLabels: Record<string, string> = {
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  yearly: 'Anual',
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Baja', color: 'bg-gray-100 text-gray-800' },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  high: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
}

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: 'clock' },
  in_progress: { label: 'En Progreso', color: 'bg-blue-100 text-blue-800', icon: 'loader' },
  completed: { label: 'Completada', color: 'bg-green-100 text-green-800', icon: 'check' },
  cancelled: { label: 'Cancelada', color: 'bg-gray-100 text-gray-800', icon: 'x' },
}

// ── Interfaces ──

interface MaintenanceSchedule {
  id: string
  building_id: string
  title: string
  description: string | null
  category: string
  frequency: string
  next_due: string
  last_completed: string | null
  assigned_provider: string | null
  assigned_provider_phone: string | null
  estimated_cost: number | null
  priority: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface WorkOrder {
  id: string
  schedule_id: string | null
  building_id: string
  title: string
  description: string | null
  category: string
  status: string
  priority: string
  assigned_provider: string | null
  assigned_provider_phone: string | null
  scheduled_date: string | null
  completed_date: string | null
  actual_cost: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ── Group by month helper ──

function groupByMonth(items: MaintenanceSchedule[]): Record<string, MaintenanceSchedule[]> {
  const groups: Record<string, MaintenanceSchedule[]> = {}
  for (const item of items) {
    const date = new Date(item.next_due)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const label = date.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
    if (!groups[label]) groups[label] = []
    groups[label].push(item)
  }
  return groups
}

// ── Main Panel ──

export function MaintenancePanel({ buildingId }: { buildingId: string }) {
  const [activeTab, setActiveTab] = useState<'calendar' | 'orders' | 'upcoming'>('calendar')
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([])
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [upcoming, setUpcoming] = useState<MaintenanceSchedule[]>([])
  const [loading, setLoading] = useState(true)

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    category: 'elevator',
    frequency: 'monthly',
    next_due: '',
    assigned_provider: '',
    assigned_provider_phone: '',
    estimated_cost: '',
    priority: 'normal',
  })
  const [creating, setCreating] = useState(false)

  // Work order detail
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null)
  const [statusNotes, setStatusNotes] = useState('')

  // Filters
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')

  // Fetch schedules
  const fetchSchedules = useCallback(async () => {
    try {
      const res = await fetch(`/api/maintenance/schedules?buildingId=${buildingId}`)
      if (res.ok) {
        const data = await res.json()
        setSchedules(data.schedules || [])
      }
    } catch (err) {
      console.error('Error fetching schedules:', err)
    }
  }, [buildingId])

  // Fetch work orders
  const fetchWorkOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams({ buildingId })
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (filterCategory !== 'all') params.set('category', filterCategory)
      const res = await fetch(`/api/maintenance/work-orders?${params}`)
      if (res.ok) {
        const data = await res.json()
        setWorkOrders(data.workOrders || [])
      }
    } catch (err) {
      console.error('Error fetching work orders:', err)
    }
  }, [buildingId, filterStatus, filterCategory])

  // Fetch upcoming
  const fetchUpcoming = useCallback(async () => {
    try {
      const res = await fetch(`/api/maintenance/schedules?buildingId=${buildingId}`)
      if (res.ok) {
        const data = await res.json()
        const all = data.schedules || []
        const today = new Date().toISOString().split('T')[0]
        const weekFromNow = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
        setUpcoming(all.filter((s: MaintenanceSchedule) => s.next_due >= today && s.next_due <= weekFromNow))
      }
    } catch (err) {
      console.error('Error fetching upcoming:', err)
    }
  }, [buildingId])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchSchedules(), fetchWorkOrders(), fetchUpcoming()]).finally(() => setLoading(false))
  }, [fetchSchedules, fetchWorkOrders, fetchUpcoming])

  // Create schedule
  const handleCreate = async () => {
    if (!createForm.title || !createForm.next_due) return
    setCreating(true)
    try {
      const res = await fetch('/api/maintenance/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...createForm, building_id: buildingId }),
      })
      if (res.ok) {
        setCreateDialogOpen(false)
        setCreateForm({
          title: '', description: '', category: 'elevator', frequency: 'monthly',
          next_due: '', assigned_provider: '', assigned_provider_phone: '',
          estimated_cost: '', priority: 'normal',
        })
        fetchSchedules()
        fetchUpcoming()
      }
    } catch (err) {
      console.error('Error creating schedule:', err)
    } finally {
      setCreating(false)
    }
  }

  // Delete schedule (soft)
  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/maintenance/schedules?buildingId=${buildingId}`, { method: 'GET' })
      // Use a PATCH-style approach via the schedule update endpoint
      // For now, we'll refetch after soft delete
      fetchSchedules()
      fetchUpcoming()
    } catch (err) {
      console.error('Error deleting schedule:', err)
    }
  }

  // Update work order status
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/maintenance/work-orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notes: statusNotes || undefined }),
      })
      if (res.ok) {
        fetchWorkOrders()
        setSelectedOrder(null)
        setStatusNotes('')
      }
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  // Generate work orders from overdue schedules
  const handleGenerate = async () => {
    try {
      const res = await fetch('/api/maintenance/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ building_id: buildingId, generate: true }),
      })
      if (res.ok) {
        fetchWorkOrders()
        fetchSchedules()
        fetchUpcoming()
      }
    } catch (err) {
      console.error('Error generating orders:', err)
    }
  }

  // Work order detail view
  if (selectedOrder) {
    return (
      <WorkOrderDetail
        order={selectedOrder}
        statusNotes={statusNotes}
        onNotesChange={setStatusNotes}
        onStatusChange={handleStatusChange}
        onBack={() => { setSelectedOrder(null); setStatusNotes(''); fetchWorkOrders(); }}
      />
    )
  }

  const overdueCount = schedules.filter(s => s.next_due < new Date().toISOString().split('T')[0]).length
  const pendingOrders = workOrders.filter(o => o.status === 'pending').length

  const tabs = [
    { id: 'calendar' as const, label: 'Calendario', icon: Calendar },
    { id: 'orders' as const, label: 'Ordenes de Trabajo', icon: ClipboardList, badge: pendingOrders },
    { id: 'upcoming' as const, label: 'Proximos', icon: Clock, badge: upcoming.length },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Mantenimiento Preventivo</h2>
          {overdueCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {overdueCount} vencido{overdueCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerate} className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Generar Ordenes
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Crear Programacion
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Programaciones</span>
            </div>
            <p className="text-2xl font-bold mt-1">{schedules.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-muted-foreground">Vencidos</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-red-600">{overdueCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-muted-foreground">Pendientes</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-yellow-600">{pendingOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Completadas</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-green-600">
              {workOrders.filter(o => o.status === 'completed').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {'badge' in tab && tab.badge !== undefined && tab.badge > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {tab.badge}
                </Badge>
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : activeTab === 'calendar' ? (
        <CalendarView schedules={schedules} />
      ) : activeTab === 'orders' ? (
        <OrdersView
          orders={workOrders}
          filterStatus={filterStatus}
          filterCategory={filterCategory}
          onFilterStatusChange={setFilterStatus}
          onFilterCategoryChange={setFilterCategory}
          onSelectOrder={setSelectedOrder}
        />
      ) : (
        <UpcomingView items={upcoming} />
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Crear Programacion de Mantenimiento</DialogTitle>
            <DialogDescription>Programa un mantenimiento preventivo recurrente</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Titulo *</label>
              <Input
                value={createForm.title}
                onChange={e => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ej: Mantenimiento ascensor"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Descripcion</label>
              <Textarea
                value={createForm.description}
                onChange={e => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe el mantenimiento..."
                rows={3}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Categoria *</label>
                <Select value={createForm.category} onValueChange={v => setCreateForm(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Frecuencia *</label>
                <Select value={createForm.frequency} onValueChange={v => setCreateForm(prev => ({ ...prev, frequency: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(frequencyLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Proximo Vencimiento *</label>
                <Input
                  type="date"
                  value={createForm.next_due}
                  onChange={e => setCreateForm(prev => ({ ...prev, next_due: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Prioridad</label>
                <Select value={createForm.priority} onValueChange={v => setCreateForm(prev => ({ ...prev, priority: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
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
                <label className="text-sm font-medium text-foreground">Proveedor</label>
                <Input
                  value={createForm.assigned_provider}
                  onChange={e => setCreateForm(prev => ({ ...prev, assigned_provider: e.target.value }))}
                  placeholder="Nombre del proveedor"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Telefono Proveedor</label>
                <Input
                  value={createForm.assigned_provider_phone}
                  onChange={e => setCreateForm(prev => ({ ...prev, assigned_provider_phone: e.target.value }))}
                  placeholder="Ej: 300-1234567"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Costo Estimado</label>
              <Input
                type="number"
                value={createForm.estimated_cost}
                onChange={e => setCreateForm(prev => ({ ...prev, estimated_cost: e.target.value }))}
                placeholder="0.00"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating || !createForm.title || !createForm.next_due}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Calendar View ──

function CalendarView({ schedules }: { schedules: MaintenanceSchedule[] }) {
  const grouped = groupByMonth(schedules)

  if (schedules.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No hay programaciones de mantenimiento</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([month, items]) => (
        <div key={month}>
          <h3 className="text-lg font-semibold text-foreground capitalize mb-3">{month}</h3>
          <div className="space-y-3">
            {items.map(schedule => {
              const isOverdue = schedule.next_due < new Date().toISOString().split('T')[0]
              return (
                <Card key={schedule.id} className={isOverdue ? 'border-red-200 bg-red-50/50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground">{schedule.title}</h4>
                          <Badge className={categoryColors[schedule.category] || 'bg-gray-100 text-gray-800'}>
                            {categoryLabels[schedule.category] || schedule.category}
                          </Badge>
                          <Badge className={priorityConfig[schedule.priority]?.color || 'bg-gray-100 text-gray-800'}>
                            {priorityConfig[schedule.priority]?.label || schedule.priority}
                          </Badge>
                          {isOverdue && (
                            <Badge variant="destructive">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Vencido
                            </Badge>
                          )}
                        </div>
                        {schedule.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{schedule.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {frequencyLabels[schedule.frequency]}
                          </span>
                          <span>
                            Proximo: {new Date(schedule.next_due).toLocaleDateString('es-CO')}
                          </span>
                          {schedule.assigned_provider && (
                            <span className="flex items-center gap-1">
                              <Wrench className="h-3 w-3" />
                              {schedule.assigned_provider}
                            </span>
                          )}
                          {schedule.estimated_cost && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ${schedule.estimated_cost.toLocaleString('es-CO')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {new Date(schedule.next_due).toLocaleDateString('es-CO', { day: 'numeric', weekday: 'short' })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Orders View ──

function OrdersView({
  orders,
  filterStatus,
  filterCategory,
  onFilterStatusChange,
  onFilterCategoryChange,
  onSelectOrder,
}: {
  orders: WorkOrder[]
  filterStatus: string
  filterCategory: string
  onFilterStatusChange: (v: string) => void
  onFilterCategoryChange: (v: string) => void
  onSelectOrder: (order: WorkOrder) => void
}) {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3">
        <Select value={filterStatus} onValueChange={onFilterStatusChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={onFilterCategoryChange}>
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
      </div>

      {/* Orders list */}
      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay ordenes de trabajo</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <Card
              key={order.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onSelectOrder(order)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{order.title}</h3>
                      <Badge className={categoryColors[order.category] || 'bg-gray-100 text-gray-800'}>
                        {categoryLabels[order.category] || order.category}
                      </Badge>
                      <Badge className={priorityConfig[order.priority]?.color || 'bg-gray-100 text-gray-800'}>
                        {priorityConfig[order.priority]?.label || order.priority}
                      </Badge>
                    </div>
                    {order.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{order.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {order.scheduled_date && (
                        <span>Programada: {new Date(order.scheduled_date).toLocaleDateString('es-CO')}</span>
                      )}
                      {order.assigned_provider && (
                        <span className="flex items-center gap-1">
                          <Wrench className="h-3 w-3" />
                          {order.assigned_provider}
                        </span>
                      )}
                      {order.actual_cost && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${order.actual_cost.toLocaleString('es-CO')}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge className={statusConfig[order.status]?.color || 'bg-gray-100 text-gray-800'}>
                    {statusConfig[order.status]?.label || order.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Upcoming View ──

function UpcomingView({ items }: { items: MaintenanceSchedule[] }) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No hay mantenimientos proximos esta semana</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {items.map(item => {
        const daysUntil = Math.ceil((new Date(item.next_due).getTime() - Date.now()) / 86400000)
        return (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    daysUntil <= 1 ? 'bg-red-100' : daysUntil <= 3 ? 'bg-yellow-100' : 'bg-blue-100'
                  }`}>
                    <Calendar className={`h-5 w-5 ${
                      daysUntil <= 1 ? 'text-red-600' : daysUntil <= 3 ? 'text-yellow-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{item.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge className={categoryColors[item.category] || 'bg-gray-100 text-gray-800'}>
                        {categoryLabels[item.category]}
                      </Badge>
                      <span>{frequencyLabels[item.frequency]}</span>
                      {item.assigned_provider && <span>Proveedor: {item.assigned_provider}</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    {new Date(item.next_due).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                  </p>
                  <p className={`text-xs ${daysUntil <= 1 ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                    {daysUntil === 0 ? 'Hoy' : daysUntil === 1 ? 'Manana' : `En ${daysUntil} dias`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// ── Work Order Detail ──

function WorkOrderDetail({
  order,
  statusNotes,
  onNotesChange,
  onStatusChange,
  onBack,
}: {
  order: WorkOrder
  statusNotes: string
  onNotesChange: (v: string) => void
  onStatusChange: (id: string, status: string) => void
  onBack: () => void
}) {
  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Button>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{order.title}</CardTitle>
              <CardDescription className="mt-1">
                Orden de trabajo creada el {new Date(order.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={categoryColors[order.category] || 'bg-gray-100 text-gray-800'}>
                {categoryLabels[order.category]}
              </Badge>
              <Badge className={priorityConfig[order.priority]?.color || 'bg-gray-100 text-gray-800'}>
                {priorityConfig[order.priority]?.label}
              </Badge>
              <Badge className={statusConfig[order.status]?.color || 'bg-gray-100 text-gray-800'}>
                {statusConfig[order.status]?.label}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {order.description && <p className="text-foreground whitespace-pre-wrap">{order.description}</p>}
          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground flex-wrap">
            {order.scheduled_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Programada: {new Date(order.scheduled_date).toLocaleDateString('es-CO')}
              </span>
            )}
            {order.completed_date && (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Completada: {new Date(order.completed_date).toLocaleDateString('es-CO')}
              </span>
            )}
            {order.assigned_provider && (
              <span className="flex items-center gap-1">
                <Wrench className="h-4 w-4" />
                {order.assigned_provider}
              </span>
            )}
            {order.assigned_provider_phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                {order.assigned_provider_phone}
              </span>
            )}
            {order.actual_cost && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                Costo real: ${order.actual_cost.toLocaleString('es-CO')}
              </span>
            )}
          </div>
          {order.notes && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium text-foreground mb-1">Notas:</p>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actualizar Estado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <Button
                key={key}
                variant={order.status === key ? 'default' : 'outline'}
                onClick={() => onStatusChange(order.id, key)}
                disabled={order.status === key}
              >
                {cfg.label}
              </Button>
            ))}
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Notas (opcional)</label>
            <Textarea
              value={statusNotes}
              onChange={e => onNotesChange(e.target.value)}
              placeholder="Agregar notas sobre el cambio de estado..."
              rows={3}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
