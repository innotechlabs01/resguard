'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Building2,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  UserCheck,
  MoreHorizontal,
  RefreshCw,
  Loader2,
  Inbox,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Lead {
  id: string
  name: string
  email: string
  phone: string | null
  company_name: string | null
  building_count: number
  unit_count: number | null
  message: string | null
  plan_interest: string
  status: string
  created_at: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  new: { label: 'Nuevo', className: 'bg-primary/10 text-primary border-primary/20' },
  contacted: { label: 'Contactado', className: 'bg-info/10 text-info border-info/20' },
  demo: { label: 'Demo', className: 'bg-warning/10 text-warning border-warning/20' },
  negotiation: { label: 'Negociación', className: 'bg-purple/10 text-purple border-purple/20' },
  won: { label: 'Ganado ✅', className: 'bg-success/10 text-success border-success/20' },
  lost: { label: 'Perdido', className: 'bg-destructive/10 text-destructive border-destructive/20' },
}

const planConfig: Record<string, string> = {
  basico: 'Básico',
  profesional: 'Profesional',
  corporativo: 'Corporativo',
  no_se: 'Sin definir',
}

const nextStatus: Record<string, string[]> = {
  new: ['contacted', 'lost'],
  contacted: ['demo', 'lost'],
  demo: ['negotiation', 'lost'],
  negotiation: ['won', 'lost'],
  won: [],
  lost: ['new'],
}

export function LeadsPanel() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/sales-leads')
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'No se pudieron cargar las solicitudes.')
        return
      }
      const data = await res.json()
      setLeads(data.leads || [])
    } catch {
      setError('Error de conexión.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/sales-leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) return
      await fetchLeads()
    } catch {
      // Non-critical
    }
  }

  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === 'new').length,
    demo: leads.filter((l) => l.status === 'demo' || l.status === 'negotiation').length,
    won: leads.filter((l) => l.status === 'won').length,
    buildings: leads.reduce((sum, l) => sum + l.building_count, 0),
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Inbox className="h-4 w-4" /> Solicitudes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-success">{stats.new} nuevas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> En proceso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{stats.demo}</p>
            <p className="text-xs text-muted-foreground">demos + negociación</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UserCheck className="h-4 w-4" /> Ganados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{stats.won}</p>
            <p className="text-xs text-muted-foreground">cerrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Edificios interesados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{stats.buildings}</p>
            <p className="text-xs text-muted-foreground">en todas las solicitudes</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">{error}</div>
      )}

      {/* Leads table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Solicitudes de contacto</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchLeads} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Inbox className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">No hay solicitudes todavía.</p>
              <p className="text-xs text-muted-foreground">
                Cuando alguien llene el formulario "Hablemos" en la landing, aparecerá aquí.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Edificios</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{lead.name}</p>
                        {lead.company_name && (
                          <p className="text-xs text-muted-foreground">{lead.company_name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" /> {lead.email}
                        </p>
                        {lead.phone && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" /> {lead.phone}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{lead.building_count}</span>
                      </div>
                      {lead.unit_count && (
                        <p className="text-xs text-muted-foreground">~{lead.unit_count} unidades</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {planConfig[lead.plan_interest] || lead.plan_interest}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusConfig[lead.status]?.className || ''}
                      >
                        {statusConfig[lead.status]?.label || lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(lead.created_at).toLocaleDateString('es-CO', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {(nextStatus[lead.status] || []).map((next) => (
                            <DropdownMenuItem
                              key={next}
                              onClick={() => updateStatus(lead.id, next)}
                            >
                              Marcar como {statusConfig[next]?.label || next}
                            </DropdownMenuItem>
                          ))}
                          {lead.message && (
                            <DropdownMenuItem className="text-xs text-muted-foreground">
                              💬 {lead.message}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
