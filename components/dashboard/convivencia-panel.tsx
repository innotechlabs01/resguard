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
import { useAuth } from '@/lib/auth-context'
import {
  ShieldAlert,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  User,
  Building2,
  Loader2,
  MessageSquare,
  Ban,
  Scale,
  TrendingUp,
} from 'lucide-react'

const infractionTypeLabels: Record<string, string> = {
  noise: 'Ruido',
  pet: 'Mascotas',
  parking: 'Parqueo Indebido',
  common_area: 'Area Comun',
  smoking: 'Fumar',
  trash: 'Basuras',
  construction: 'Construccion',
  other: 'Otro',
}

const infractionTypeColors: Record<string, string> = {
  noise: 'bg-purple-100 text-purple-800',
  pet: 'bg-amber-100 text-amber-800',
  parking: 'bg-yellow-100 text-yellow-800',
  common_area: 'bg-indigo-100 text-indigo-800',
  smoking: 'bg-red-100 text-red-800',
  trash: 'bg-orange-100 text-orange-800',
  construction: 'bg-blue-100 text-blue-800',
  other: 'bg-gray-100 text-gray-800',
}

const statusConfig: Record<string, { label: string; color: string }> = {
  reported: { label: 'Reportado', color: 'bg-yellow-100 text-yellow-800' },
  notified: { label: 'Notificado', color: 'bg-blue-100 text-blue-800' },
  reply_pending: { label: 'Replica Pendiente', color: 'bg-orange-100 text-orange-800' },
  reply_received: { label: 'Replica Recibida', color: 'bg-indigo-100 text-indigo-800' },
  fine_issued: { label: 'Multa Impuesta', color: 'bg-red-100 text-red-800' },
  dismissed: { label: 'Desestimado', color: 'bg-green-100 text-green-800' },
  escalated: { label: 'Escalado', color: 'bg-gray-100 text-gray-800' },
}

interface InfractionItem {
  id: string
  building_id: string
  reporter_id: string
  reporter_name: string
  reporter_unit: string | null
  infraction_type: string
  description: string
  location: string | null
  target_unit: string
  status: string
  reply: string | null
  reply_at: string | null
  reply_deadline: string | null
  admin_decision: string | null
  admin_notes: string | null
  decided_by: string | null
  decided_at: string | null
  fine_amount: number | null
  fine_id: string | null
  created_at: string
  updated_at: string
}

interface InfractionEvidence {
  id: string
  infraction_id: string
  type: string
  url: string
  uploaded_by: string
  created_at: string
}

interface InfractionStats {
  total: number
  reported: number
  notified: number
  reply_pending: number
  reply_received: number
  fine_issued: number
  dismissed: number
  escalated: number
  by_type: Record<string, number>
  total_fines_amount: number
}

export function ConvivenciaPanel({ buildingId }: { buildingId: string }) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  const [infractionsList, setInfractionsList] = useState<InfractionItem[]>([])
  const [stats, setStats] = useState<InfractionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('all')
  const [selectedInfraction, setSelectedInfraction] = useState<InfractionItem | null>(null)
  const [evidences, setEvidences] = useState<InfractionEvidence[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    infraction_type: 'noise',
    description: '',
    target_unit: '',
    location: '',
  })
  const [creating, setCreating] = useState(false)

  // Decision dialog
  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false)
  const [decisionForm, setDecisionForm] = useState({
    decision: 'fine' as 'fine' | 'dismiss' | 'escalate',
    notes: '',
    fine_amount: '',
  })
  const [deciding, setDeciding] = useState(false)

  // Filters
  const [filterType, setFilterType] = useState<string>('all')

  // Fetch infractions list
  const fetchInfractions = useCallback(async () => {
    try {
      const params = new URLSearchParams({ buildingId })
      if (activeTab !== 'all') params.set('status', activeTab)
      if (filterType !== 'all') params.set('infraction_type', filterType)

      const res = await fetch(`/api/infractions?${params}`)
      if (res.ok) {
        const data = await res.json()
        setInfractionsList(data.infractions || [])
      }
    } catch (err) {
      console.error('Error fetching infractions:', err)
    } finally {
      setLoading(false)
    }
  }, [buildingId, activeTab, filterType])

  // Fetch stats (admin only)
  const fetchStats = useCallback(async () => {
    if (!isAdmin) return
    try {
      const res = await fetch(`/api/infractions/stats?buildingId=${buildingId}`)
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
      }
    } catch (err) {
      console.error('Error fetching infractions stats:', err)
    }
  }, [buildingId, isAdmin])

  useEffect(() => { fetchInfractions() }, [fetchInfractions])
  useEffect(() => { fetchStats() }, [fetchStats])

  // Fetch detail
  const openDetail = async (infraction: InfractionItem) => {
    setSelectedInfraction(infraction)
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/infractions/${infraction.id}`)
      if (res.ok) {
        const data = await res.json()
        setEvidences(data.evidences || [])
      }
    } catch (err) {
      console.error('Error fetching detail:', err)
    } finally {
      setLoadingDetail(false)
    }
  }

  // Create infraction
  const handleCreate = async () => {
    if (!createForm.description || !createForm.target_unit) return
    setCreating(true)
    try {
      const res = await fetch('/api/infractions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...createForm, building_id: buildingId }),
      })
      if (res.ok) {
        setCreateDialogOpen(false)
        setCreateForm({ infraction_type: 'noise', description: '', target_unit: '', location: '' })
        fetchInfractions()
        fetchStats()
      }
    } catch (err) {
      console.error('Error creating infraction:', err)
    } finally {
      setCreating(false)
    }
  }

  // Admin action
  const handleAdminAction = async (infractionId: string, action: string, data?: Record<string, any>) => {
    try {
      const res = await fetch(`/api/infractions/${infractionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data }),
      })
      if (res.ok) {
        fetchInfractions()
        fetchStats()
        if (selectedInfraction?.id === infractionId) {
          const updated = await res.json()
          setSelectedInfraction(updated.infraction)
        }
      }
    } catch (err) {
      console.error('Error updating infraction:', err)
    }
  }

  // Submit decision
  const handleDecision = async () => {
    if (!selectedInfraction || !decisionForm.notes) return
    setDeciding(true)
    try {
      await handleAdminAction(selectedInfraction.id, 'decide', {
        decision: decisionForm.decision,
        notes: decisionForm.notes,
        fine_amount: decisionForm.fine_amount ? parseFloat(decisionForm.fine_amount) : undefined,
      })
      setDecisionDialogOpen(false)
      setDecisionForm({ decision: 'fine', notes: '', fine_amount: '' })
    } finally {
      setDeciding(false)
    }
  }

  // Detail view
  if (selectedInfraction) {
    const typeColor = infractionTypeColors[selectedInfraction.infraction_type] || 'bg-gray-100 text-gray-800'
    const statCfg = statusConfig[selectedInfraction.status] || statusConfig.reported
    const isReplyPending = selectedInfraction.status === 'reply_pending' || selectedInfraction.status === 'notified'
    const isOverdue = selectedInfraction.reply_deadline && new Date(selectedInfraction.reply_deadline) < new Date()

    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => { setSelectedInfraction(null); setEvidences([]); fetchInfractions(); fetchStats(); }} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">Infraccion - Unidad {selectedInfraction.target_unit}</CardTitle>
                <CardDescription className="mt-1">
                  Reportado por {selectedInfraction.reporter_name} el {new Date(selectedInfraction.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={typeColor}>{infractionTypeLabels[selectedInfraction.infraction_type]}</Badge>
                <Badge className={statCfg.color}>{statCfg.label}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-foreground whitespace-pre-wrap">{selectedInfraction.description}</p>
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              {selectedInfraction.location && <span>Ubicacion: {selectedInfraction.location}</span>}
              {selectedInfraction.reporter_unit && <span>Unidad reportante: {selectedInfraction.reporter_unit}</span>}
            </div>
          </CardContent>
        </Card>

        {/* Reply from infractor */}
        {selectedInfraction.reply && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Replica del Infractor
              </CardTitle>
              <CardDescription>
                Enviada el {selectedInfraction.reply_at ? new Date(selectedInfraction.reply_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-wrap">{selectedInfraction.reply}</p>
            </CardContent>
          </Card>
        )}

        {/* Reply deadline warning */}
        {isReplyPending && selectedInfraction.reply_deadline && (
          <Card className={isOverdue ? 'border-red-300 bg-red-50' : 'border-orange-300 bg-orange-50'}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {isOverdue
                    ? 'Plazo de replica vencido'
                    : `Plazo de replica: ${new Date(selectedInfraction.reply_deadline).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}`}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Admin controls */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Acciones de Administrador</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-3 flex-wrap">
              {selectedInfraction.status === 'reported' && (
                <Button onClick={() => handleAdminAction(selectedInfraction.id, 'notify')} className="gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Notificar Infractor
                </Button>
              )}
              {selectedInfraction.status === 'notified' && (
                <Button onClick={() => handleAdminAction(selectedInfraction.id, 'notify')} className="gap-2">
                  <Clock className="h-4 w-4" />
                  Enviar a Replica (48h)
                </Button>
              )}
              {(selectedInfraction.status === 'reply_received' || selectedInfraction.status === 'reply_pending') && (
                <Button onClick={() => setDecisionDialogOpen(true)} className="gap-2">
                  <Scale className="h-4 w-4" />
                  Tomar Decision
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Decision result */}
        {selectedInfraction.admin_decision && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className={
                  selectedInfraction.admin_decision === 'fine' ? 'bg-red-100 text-red-800' :
                  selectedInfraction.admin_decision === 'dismiss' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }>
                  {selectedInfraction.admin_decision === 'fine' ? 'Multa Impuesta' :
                   selectedInfraction.admin_decision === 'dismiss' ? 'Desestimado' : 'Escalado'}
                </Badge>
                {selectedInfraction.fine_amount && (
                  <span className="text-sm font-semibold text-red-600">
                    ${selectedInfraction.fine_amount.toLocaleString('es-CO')}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{selectedInfraction.admin_notes}</p>
              <p className="text-xs text-muted-foreground">
                Decidido por {selectedInfraction.decided_by} el {selectedInfraction.decided_at ? new Date(selectedInfraction.decided_at).toLocaleDateString('es-CO') : ''}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // Stats for tabs
  const tabs = isAdmin
    ? [
        { id: 'all', label: 'Todos', count: stats?.total || 0 },
        { id: 'reported', label: 'Reportados', count: stats?.reported || 0 },
        { id: 'reply_pending', label: 'Replica Pendiente', count: stats?.reply_pending || 0 },
        { id: 'fine_issued', label: 'Multas', count: stats?.fine_issued || 0 },
      ]
    : [
        { id: 'all', label: 'Todos' },
        { id: 'reported', label: 'Reportados' },
        { id: 'reply_pending', label: 'Replica Pendiente' },
      ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Convivencia</h2>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Reportar
        </Button>
      </div>

      {/* Stats cards (admin only) */}
      {isAdmin && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-muted-foreground">Pendientes</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-orange-600">{stats.reply_pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Multas</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-green-600">{stats.fine_issued}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">Total Multas</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-blue-600">
                ${stats.total_fines_amount.toLocaleString('es-CO')}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      {isAdmin && (
        <div className="flex gap-3">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {Object.entries(infractionTypeLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
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
            onClick={() => setActiveTab(tab.id)}
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

      {/* Infractions list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : infractionsList.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay reportes de convivencia</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {infractionsList.map(infraction => {
            const typeColor = infractionTypeColors[infraction.infraction_type] || 'bg-gray-100 text-gray-800'
            const statCfg = statusConfig[infraction.status] || statusConfig.reported
            const isOverdue = infraction.reply_deadline && new Date(infraction.reply_deadline) < new Date()

            return (
              <Card
                key={infraction.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => openDetail(infraction)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">
                          Unidad {infraction.target_unit}
                        </h3>
                        <Badge className={typeColor}>
                          {infractionTypeLabels[infraction.infraction_type]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{infraction.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {infraction.reporter_name}
                        </span>
                        <span>{new Date(infraction.created_at).toLocaleDateString('es-CO')}</span>
                        {infraction.fine_amount && (
                          <span className="text-red-600 font-semibold">
                            Multa: ${infraction.fine_amount.toLocaleString('es-CO')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={statCfg.color}>{statCfg.label}</Badge>
                      {isOverdue && (
                        <Badge className="bg-red-100 text-red-800 text-xs">Plazo Vencido</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reportar Infraccion</DialogTitle>
            <DialogDescription>Registra un problema de convivencia en el edificio</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Tipo de Infraccion *</label>
              <Select
                value={createForm.infraction_type}
                onValueChange={v => setCreateForm(prev => ({ ...prev, infraction_type: v }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(infractionTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Descripcion *</label>
              <Textarea
                value={createForm.description}
                onChange={e => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe la infraccion en detalle..."
                rows={4}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Unidad Infractora *</label>
                <Input
                  value={createForm.target_unit}
                  onChange={e => setCreateForm(prev => ({ ...prev, target_unit: e.target.value }))}
                  placeholder="Ej: 301"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Ubicacion</label>
                <Input
                  value={createForm.location}
                  onChange={e => setCreateForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Ej: Tercer piso"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating || !createForm.description || !createForm.target_unit}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Reportar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decision Dialog */}
      <Dialog open={decisionDialogOpen} onOpenChange={setDecisionDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tomar Decision</DialogTitle>
            <DialogDescription>Decide sobre esta infraccion de convivencia</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Decision *</label>
              <Select
                value={decisionForm.decision}
                onValueChange={v => setDecisionForm(prev => ({ ...prev, decision: v as any }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fine">Imponer Multa</SelectItem>
                  <SelectItem value="dismiss">Desestimar</SelectItem>
                  <SelectItem value="escalate">Escalar a Asamblea</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {decisionForm.decision === 'fine' && (
              <div>
                <label className="text-sm font-medium text-foreground">Monto de la Multa (COP)</label>
                <Input
                  type="number"
                  value={decisionForm.fine_amount}
                  onChange={e => setDecisionForm(prev => ({ ...prev, fine_amount: e.target.value }))}
                  placeholder="Ej: 100000"
                  className="mt-1"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground">Notas *</label>
              <Textarea
                value={decisionForm.notes}
                onChange={e => setDecisionForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Justificacion de la decision..."
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecisionDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleDecision} disabled={deciding || !decisionForm.notes}>
              {deciding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
