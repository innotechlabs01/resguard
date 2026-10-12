'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Ticket,
  ShieldAlert,
  Clock,
  AlertCircle,
  Loader2,
  User,
  Building2,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface ResidentOption {
  id: string
  name: string
  unit: string | null
}

interface PqrsItem {
  id: string
  subject: string
  description: string
  category: string
  priority: string
  status: string
  unit: string | null
  created_by_unit: string | null
  created_by_name: string
  assigned_to: string | null
  created_at: string
}

interface InfractionItem {
  id: string
  description: string
  infraction_type: string
  status: string
  target_unit: string
  reporter_name: string
  reply_deadline: string | null
  created_at: string
  fine_amount: number | null
}

interface PqrsStats {
  total: number
  open: number
  in_progress: number
  resolved: number
  closed: number
  waiting: number
  reopened: number
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
}

const pqrsCategoryLabels: Record<string, string> = {
  maintenance: 'Mantenimiento',
  noise: 'Ruido',
  security: 'Seguridad',
  cleaning: 'Limpieza',
  parking: 'Parqueadero',
  common_areas: 'Areas Comun',
  billing: 'Facturacion',
  other: 'Otro',
}

const pqrsCategoryColors: Record<string, string> = {
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

const pqrsStatusConfig: Record<string, { label: string; color: string }> = {
  open: { label: 'Abierto', color: 'bg-yellow-100 text-yellow-800' },
  in_progress: { label: 'En Progreso', color: 'bg-blue-100 text-blue-800' },
  waiting: { label: 'En Espera', color: 'bg-orange-100 text-orange-800' },
  resolved: { label: 'Resuelto', color: 'bg-green-100 text-green-800' },
  closed: { label: 'Cerrado', color: 'bg-gray-100 text-gray-800' },
  reopened: { label: 'Reabierto', color: 'bg-red-100 text-red-800' },
}

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

const infractionStatusConfig: Record<string, { label: string; color: string }> = {
  reported: { label: 'Reportado', color: 'bg-yellow-100 text-yellow-800' },
  notified: { label: 'Notificado', color: 'bg-blue-100 text-blue-800' },
  reply_pending: { label: 'Replica Pendiente', color: 'bg-orange-100 text-orange-800' },
  reply_received: { label: 'Replica Recibida', color: 'bg-indigo-100 text-indigo-800' },
  fine_issued: { label: 'Multa Impuesta', color: 'bg-red-100 text-red-800' },
  dismissed: { label: 'Desestimado', color: 'bg-green-100 text-green-800' },
  escalated: { label: 'Escalado', color: 'bg-gray-100 text-gray-800' },
}

const PQRS_PENDING_STATUSES = ['open', 'in_progress', 'waiting', 'reopened']
const INFRACTION_PENDING_STATUSES = ['reported', 'notified', 'reply_pending', 'reply_received']
const PRIORITY_RANK: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 }

function formatDate(iso: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function HelpdeskInboxPanel({
  buildingId,
  residents,
  onOpenDetail,
}: {
  buildingId: string
  residents?: ResidentOption[]
  onOpenDetail?: (type: 'pqrs' | 'infraction', id: string) => void
}) {
  const [pqrsList, setPqrsList] = useState<PqrsItem[]>([])
  const [infractionsList, setInfractionsList] = useState<InfractionItem[]>([])
  const [pqrsStats, setPqrsStats] = useState<PqrsStats | null>(null)
  const [infractionStats, setInfractionStats] = useState<InfractionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedUnit, setSelectedUnit] = useState<string>('')
  const [unitInput, setUnitInput] = useState<string>('')

  // Client-side pagination for pending lists (base lists are fetched with pageSize=100)
  const [pqrsPage, setPqrsPage] = useState(1)
  const [infractionsPage, setInfractionsPage] = useState(1)
  const pendingPageSize = 10

  const fetchData = useCallback(async () => {
    setLoading(true)
    setPqrsPage(1)
    setInfractionsPage(1)
    try {
      const results = await Promise.allSettled([
        fetch(`/api/pqrs?buildingId=${buildingId}&pageSize=100`),
        fetch(`/api/infractions?buildingId=${buildingId}&pageSize=100`),
        fetch(`/api/pqrs/stats?buildingId=${buildingId}`),
        fetch(`/api/infractions/stats?buildingId=${buildingId}`),
      ])

      const [pqrsRes, infractionsRes, pqrsStatsRes, infractionStatsRes] = results

      if (pqrsRes.status === 'fulfilled' && pqrsRes.value.ok) {
        const data = await pqrsRes.value.json()
        setPqrsList(data.pqrs || [])
      } else {
        setPqrsList([])
      }

      if (infractionsRes.status === 'fulfilled' && infractionsRes.value.ok) {
        const data = await infractionsRes.value.json()
        setInfractionsList(data.infractions || [])
      } else {
        setInfractionsList([])
      }

      if (pqrsStatsRes.status === 'fulfilled' && pqrsStatsRes.value.ok) {
        const data = await pqrsStatsRes.value.json()
        setPqrsStats(data.stats || null)
      } else {
        setPqrsStats(null)
      }

      if (infractionStatsRes.status === 'fulfilled' && infractionStatsRes.value.ok) {
        const data = await infractionStatsRes.value.json()
        setInfractionStats(data.stats || null)
      } else {
        setInfractionStats(null)
      }
    } catch (err) {
      console.error('Error fetching inbox data:', err)
    } finally {
      setLoading(false)
    }
  }, [buildingId])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Derived counts ──

  const pendingPqrsCount =
    pqrsStats !== null
      ? pqrsStats.open + pqrsStats.in_progress + pqrsStats.waiting + pqrsStats.reopened
      : pqrsList.filter(p => PQRS_PENDING_STATUSES.includes(p.status)).length

  const pendingInfractionsCount =
    infractionStats !== null
      ? infractionStats.reported + infractionStats.notified + infractionStats.reply_pending + infractionStats.reply_received
      : infractionsList.filter(i => INFRACTION_PENDING_STATUSES.includes(i.status)).length

  const overdueReplies = infractionsList.filter(i =>
    i.reply_deadline &&
    new Date(i.reply_deadline) < new Date() &&
    (i.status === 'reply_pending' || i.status === 'notified')
  )

  const totalUnresolved = pendingPqrsCount + pendingInfractionsCount

  // ── Pending lists (filtered + sorted) ──

  const pendingPqrs = pqrsList
    .filter(p => PQRS_PENDING_STATUSES.includes(p.status))
    .sort((a, b) => {
      const rankDiff = (PRIORITY_RANK[a.priority] ?? 99) - (PRIORITY_RANK[b.priority] ?? 99)
      if (rankDiff !== 0) return rankDiff
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const pendingInfractions = infractionsList
    .filter(i => INFRACTION_PENDING_STATUSES.includes(i.status))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // Pagination slices of pending lists
  const pqrsTotalPages = Math.max(1, Math.ceil(pendingPqrs.length / pendingPageSize))
  const infractionsTotalPages = Math.max(1, Math.ceil(pendingInfractions.length / pendingPageSize))
  const visiblePendingPqrs = pendingPqrs.slice((pqrsPage - 1) * pendingPageSize, pqrsPage * pendingPageSize)
  const visiblePendingInfractions = pendingInfractions.slice((infractionsPage - 1) * pendingPageSize, infractionsPage * pendingPageSize)

  // ── Unit history ──

  const resolvedUnit = selectedUnit || unitInput.trim()

  const unitPqrs = resolvedUnit
    ? pqrsList.filter(p => p.unit === resolvedUnit || p.created_by_unit === resolvedUnit)
    : []

  const unitInfractions = resolvedUnit
    ? infractionsList.filter(i => i.target_unit === resolvedUnit)
    : []

  const unitHistory = [
    ...unitPqrs.map(p => ({
      id: p.id,
      type: 'pqrs' as const,
      title: p.subject,
      status: p.status,
      date: p.created_at,
    })),
    ...unitInfractions.map(i => ({
      id: i.id,
      type: 'infraction' as const,
      title: `Unidad ${i.target_unit} — ${infractionTypeLabels[i.infraction_type] || i.infraction_type}`,
      status: i.status,
      date: i.created_at,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const hasResidents = !!residents && residents.length > 0

  // Unique units from residents (households share a unit); only units can be searched in the history
  const unitOptions = residents
    ? Array.from(new Map(residents.filter(r => r.unit).map(r => [r.unit, r])).values())
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Search className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Inbox</h2>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-muted-foreground">PQRS Pendientes</span>
            </div>
            <p className="text-2xl font-bold mt-1">{loading ? '...' : pendingPqrsCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-muted-foreground">Convivencia Pendiente</span>
            </div>
            <p className="text-2xl font-bold mt-1">{loading ? '...' : pendingInfractionsCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-red-600" />
              <span className="text-sm text-muted-foreground">Replicas Vencidas</span>
            </div>
            <p className={`text-2xl font-bold mt-1 ${overdueReplies.length > 0 ? 'text-red-600' : ''}`}>
              {loading ? '...' : overdueReplies.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">Sin Resolver</span>
            </div>
            <p className="text-2xl font-bold mt-1">{loading ? '...' : totalUnresolved}</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* PQRS pendientes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                PQRS Pendientes
              </CardTitle>
              <CardDescription>
                Solicitudes abiertas, en progreso, en espera o reabiertas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingPqrs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No hay PQRS pendientes</p>
              ) : (
                <div className="space-y-2">
                  {visiblePendingPqrs.map(p => (
                    <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground truncate">{p.subject}</span>
                          <Badge className={pqrsCategoryColors[p.category] || 'bg-gray-100 text-gray-800'}>
                            {pqrsCategoryLabels[p.category] || p.category}
                          </Badge>
                          <Badge className={priorityConfig[p.priority]?.color || 'bg-gray-100 text-gray-800'}>
                            {priorityConfig[p.priority]?.label || p.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {(p.unit || p.created_by_unit) && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {p.unit || p.created_by_unit}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {p.created_by_name}
                          </span>
                          <span>{formatDate(p.created_at)}</span>
                        </div>
                      </div>
                      <Badge className={pqrsStatusConfig[p.status]?.color || 'bg-gray-100 text-gray-800'}>
                        {pqrsStatusConfig[p.status]?.label || p.status}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => onOpenDetail?.('pqrs', p.id)}>
                        Ver
                      </Button>
                    </div>
                  ))}
                  {/* Pagination footer */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-muted-foreground">{pendingPqrs.length} registros</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Página {pqrsPage} de {pqrsTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pqrsPage <= 1}
                        onClick={() => setPqrsPage(p => Math.max(1, p - 1))}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pqrsPage >= pqrsTotalPages}
                        onClick={() => setPqrsPage(p => p + 1)}
                      >
                        Siguiente
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Convivencia pendientes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                Convivencia Pendiente
              </CardTitle>
              <CardDescription>
                Reportes sin resolver con plazo de replica activo o vencido
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingInfractions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No hay reportes de convivencia pendientes</p>
              ) : (
                <div className="space-y-2">
                  {visiblePendingInfractions.map(i => {
                    const isOverdue = i.reply_deadline && new Date(i.reply_deadline) < new Date()
                    return (
                      <div key={i.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground truncate">Unidad {i.target_unit}</span>
                            <Badge className={infractionTypeColors[i.infraction_type] || 'bg-gray-100 text-gray-800'}>
                              {infractionTypeLabels[i.infraction_type] || i.infraction_type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">{i.description}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{formatDate(i.created_at)}</span>
                            {i.reply_deadline && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(i.reply_deadline)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge className={infractionStatusConfig[i.status]?.color || 'bg-gray-100 text-gray-800'}>
                            {infractionStatusConfig[i.status]?.label || i.status}
                          </Badge>
                          {isOverdue && (
                            <Badge className="bg-red-100 text-red-800 text-xs">Vencido</Badge>
                          )}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => onOpenDetail?.('infraction', i.id)}>
                          Ver
                        </Button>
                      </div>
                    )
                  })}
                  {/* Pagination footer */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-muted-foreground">{pendingInfractions.length} registros</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Página {infractionsPage} de {infractionsTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={infractionsPage <= 1}
                        onClick={() => setInfractionsPage(p => Math.max(1, p - 1))}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={infractionsPage >= infractionsTotalPages}
                        onClick={() => setInfractionsPage(p => p + 1)}
                      >
                        Siguiente
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Historial por unidad */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Historial por Unidad
              </CardTitle>
              <CardDescription>
                PQRS y reportes de convivencia de una unidad
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                {unitOptions.length > 0 ? (
                  <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                    <SelectTrigger className="w-full md:w-72">
                      <SelectValue placeholder="Selecciona una unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {unitOptions.map(r => (
                        <SelectItem key={r.id} value={r.unit!}>
                          {r.unit ? `Unidad ${r.unit}` : r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={unitInput}
                    onChange={e => setUnitInput(e.target.value)}
                    placeholder="Buscar por unidad (ej: 301)"
                    className="w-full md:w-72"
                  />
                )}
              </div>

              {!resolvedUnit ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Selecciona una unidad para ver su historial
                </p>
              ) : unitHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sin registros para esta unidad
                </p>
              ) : (
                <div className="space-y-2">
                  {unitHistory.map(row => (
                    <div key={`${row.type}-${row.id}`} className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <Badge className={row.type === 'pqrs' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                        {row.type === 'pqrs' ? 'PQRS' : 'Convivencia'}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{row.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(row.date)}</p>
                      </div>
                      <Badge className={
                        row.type === 'pqrs'
                          ? (pqrsStatusConfig[row.status]?.color || 'bg-gray-100 text-gray-800')
                          : (infractionStatusConfig[row.status]?.color || 'bg-gray-100 text-gray-800')
                      }>
                        {row.type === 'pqrs'
                          ? (pqrsStatusConfig[row.status]?.label || row.status)
                          : (infractionStatusConfig[row.status]?.label || row.status)}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenDetail?.(row.type, row.id)}
                      >
                        Ver
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}