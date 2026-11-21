'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Building2,
  Users,
  Search,
  RefreshCw,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Ban,
  Eye,
  MoreHorizontal,
  CreditCard,
  Mail,
  Phone,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CrmAdmin {
  id: string
  name: string
  email: string
  role: string
  status: string
}

interface CrmBuilding {
  id: string
  name: string
  address: string
  total_units: number
  monthly_fee: number
  outstanding_balance: number
  subscription_status: string
}

interface CrmSubscription {
  id: string
  status: string
  plan_id: string | null
  plan_code: string | null
  plan_name: string | null
  max_buildings: number | null
  max_admin_users: number | null
  max_units: number | null
  price_cop: number | null
  current_period_end: string | null
  blocked_at: string | null
}

export interface OrganizationCrm {
  id: string
  name: string
  type: 'hogar' | 'grupo' | 'comunidad' | 'inmobiliaria'
  status: 'active' | 'suspended' | 'blocked' | 'canceled'
  owner_user_id: string | null
  contact_email: string | null
  contact_phone: string | null
  created_at: string
  updated_at: string
  owner: CrmAdmin | null
  admins: CrmAdmin[]
  buildings: CrmBuilding[]
  buildings_count: number
  residents_count: number
  monthly_revenue: number
  outstanding_balance: number
  subscription: CrmSubscription | null
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  active: { label: 'Activo', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  suspended: { label: 'Suspendido', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  blocked: { label: 'Bloqueado', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  canceled: { label: 'Cancelado', className: 'bg-muted text-muted-foreground border-border' },
}

const TYPE_LABEL: Record<string, string> = {
  hogar: 'Hogar',
  grupo: 'Grupo',
  comunidad: 'Comunidad',
  inmobiliaria: 'Inmobiliaria',
}

const PLAN_OPTIONS: Array<{ code: 'basico' | 'profesional' | 'corporativo'; label: string }> = [
  { code: 'basico', label: 'Básico' },
  { code: 'profesional', label: 'Profesional' },
  { code: 'corporativo', label: 'Corporativo' },
]

function formatCop(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

export function OrganizationsCrmPanel() {
  const [organizations, setOrganizations] = useState<OrganizationCrm[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedOrg, setSelectedOrg] = useState<OrganizationCrm | null>(null)

  const fetchOrganizations = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/organizations', { cache: 'no-store' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Error al cargar organizaciones')
        return
      }
      const data = await res.json()
      setOrganizations(Array.isArray(data.organizations) ? data.organizations : [])
    } catch {
      toast.error('Error de conexión al cargar CRM de tenants')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrganizations()
  }, [fetchOrganizations])

  const handlePatchOrg = async (
    orgId: string,
    payload: {
      status?: 'active' | 'suspended' | 'blocked' | 'canceled'
      type?: 'hogar' | 'grupo' | 'comunidad' | 'inmobiliaria'
      plan_code?: 'basico' | 'profesional' | 'corporativo'
    },
    successMessage: string
  ) => {
    setSavingId(orgId)
    try {
      const res = await fetch('/api/organizations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orgId, ...payload }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'No se pudo actualizar la organización')
        return
      }
      toast.success(successMessage)
      await fetchOrganizations()
      if (selectedOrg && selectedOrg.id === orgId) {
        setSelectedOrg((prev) =>
          prev
            ? {
                ...prev,
                status: data.organization?.status ?? prev.status,
                type: data.organization?.type ?? prev.type,
              }
            : null
        )
      }
    } catch {
      toast.error('Error de red al actualizar organización')
    } finally {
      setSavingId(null)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return organizations.filter((org) => {
      if (statusFilter !== 'all' && org.status !== statusFilter) return false
      if (typeFilter !== 'all' && org.type !== typeFilter) return false
      if (!q) return true
      const haystack = [
        org.name,
        org.contact_email || '',
        org.owner?.name || '',
        org.owner?.email || '',
        ...org.buildings.map((b) => b.name),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [organizations, search, statusFilter, typeFilter])

  const summary = useMemo(() => {
    const total = organizations.length
    const active = organizations.filter((o) => o.status === 'active').length
    const restricted = organizations.filter((o) => o.status === 'suspended' || o.status === 'blocked').length
    const mrr = organizations.reduce((s, o) => s + Number(o.monthly_revenue || 0), 0)
    const mora = organizations.reduce((s, o) => s + Number(o.outstanding_balance || 0), 0)
    return { total, active, restricted, mrr, mora }
  }, [organizations])

  return (
    <div className="space-y-6">
      {/* KPI Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tenants</CardTitle>
            <Briefcase className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
            <p className="text-xs text-muted-foreground">{summary.active} activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Suspendidos / Bloqueados</CardTitle>
            <ShieldAlert className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.restricted}</div>
            <p className="text-xs text-muted-foreground">Requieren seguimiento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos Mensuales</CardTitle>
            <CreditCard className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCop(summary.mrr)}</div>
            <p className="text-xs text-muted-foreground">Facturación agregada</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mora Total</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCop(summary.mora)}</div>
            <p className="text-xs text-muted-foreground">Saldo pendiente por cobrar</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>CRM de Administradores y Tenants</CardTitle>
              <CardDescription>
                Controla el estado, plan y límites de cada organización y sus administradores.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchOrganizations} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por organización, administrador, correo o edificio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[170px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="suspended">Suspendidos</SelectItem>
                <SelectItem value="blocked">Bloqueados</SelectItem>
                <SelectItem value="canceled">Cancelados</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[170px]">
                <SelectValue placeholder="Tipo de tenant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="hogar">Hogar</SelectItem>
                <SelectItem value="grupo">Grupo</SelectItem>
                <SelectItem value="comunidad">Comunidad</SelectItem>
                <SelectItem value="inmobiliaria">Inmobiliaria</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Cargando organizaciones...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No se encontraron organizaciones con los filtros actuales.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organización / Titular</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Edificios</TableHead>
                    <TableHead>Residentes</TableHead>
                    <TableHead>Ingresos / Mora</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((org) => {
                    const statusBadge = STATUS_BADGE[org.status] || STATUS_BADGE.active
                    const maxB = org.subscription?.max_buildings
                    const isSaving = savingId === org.id
                    return (
                      <TableRow key={org.id}>
                        <TableCell>
                          <div className="font-medium">{org.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {org.owner ? `${org.owner.name} (${org.owner.email})` : org.contact_email || 'Sin titular'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{TYPE_LABEL[org.type] || org.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusBadge.className}>
                            {statusBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {org.subscription?.plan_name || org.subscription?.plan_code ? (
                            <div className="flex flex-col">
                              <span className="text-sm font-medium capitalize">
                                {org.subscription.plan_name || org.subscription.plan_code}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {org.subscription.status}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sin plan</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>
                              {org.buildings_count}
                              {maxB ? ` / ${maxB}` : ''}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{org.residents_count}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{formatCop(org.monthly_revenue)}</div>
                          {org.outstanding_balance > 0 ? (
                            <div className="text-xs text-destructive">
                              Mora: {formatCop(org.outstanding_balance)}
                            </div>
                          ) : (
                            <div className="text-xs text-emerald-600">Al día</div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Ver detalle"
                              onClick={() => setSelectedOrg(org)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={isSaving}>
                                  {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <MoreHorizontal className="h-4 w-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuLabel>Estado del Tenant</DropdownMenuLabel>
                                <DropdownMenuItem
                                  disabled={org.status === 'active'}
                                  onClick={() =>
                                    handlePatchOrg(org.id, { status: 'active' }, 'Tenant activado')
                                  }
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                                  Activar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={org.status === 'suspended'}
                                  onClick={() =>
                                    handlePatchOrg(org.id, { status: 'suspended' }, 'Tenant suspendido')
                                  }
                                >
                                  <ShieldAlert className="mr-2 h-4 w-4 text-amber-500" />
                                  Suspender
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={org.status === 'blocked'}
                                  onClick={() =>
                                    handlePatchOrg(org.id, { status: 'blocked' }, 'Tenant bloqueado')
                                  }
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  Bloquear
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Cambiar Plan</DropdownMenuLabel>
                                {PLAN_OPTIONS.map((plan) => (
                                  <DropdownMenuItem
                                    key={plan.code}
                                    onClick={() =>
                                      handlePatchOrg(
                                        org.id,
                                        { plan_code: plan.code },
                                        `Plan actualizado a ${plan.label}`
                                      )
                                    }
                                  >
                                    <CreditCard className="mr-2 h-4 w-4 text-primary" />
                                    Plan {plan.label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!selectedOrg} onOpenChange={(open) => !open && setSelectedOrg(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedOrg && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  {selectedOrg.name}
                </DialogTitle>
                <DialogDescription>
                  Tipo: {TYPE_LABEL[selectedOrg.type] || selectedOrg.type} · Estado:{' '}
                  {STATUS_BADGE[selectedOrg.status]?.label || selectedOrg.status}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 pt-2">
                {/* Contact & Plan */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Contacto del Tenant</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1.5 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        <span>{selectedOrg.contact_email || selectedOrg.owner?.email || 'Sin correo'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{selectedOrg.contact_phone || 'Sin teléfono'}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Suscripción y Límites</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                      <div>
                        Plan:{' '}
                        <span className="font-medium">
                          {selectedOrg.subscription?.plan_name || selectedOrg.subscription?.plan_code || 'Sin plan'}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Edificios: {selectedOrg.buildings_count}
                        {selectedOrg.subscription?.max_buildings
                          ? ` / ${selectedOrg.subscription.max_buildings}`
                          : ' (sin límite)'}
                        {' · '}
                        Admins: {selectedOrg.admins.length}
                        {selectedOrg.subscription?.max_admin_users
                          ? ` / ${selectedOrg.subscription.max_admin_users}`
                          : ''}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Ingresos: {formatCop(selectedOrg.monthly_revenue)} · Mora:{' '}
                        {formatCop(selectedOrg.outstanding_balance)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Admins List */}
                <div>
                  <h4 className="mb-2 text-sm font-semibold">
                    Administradores ({selectedOrg.admins.length})
                  </h4>
                  {selectedOrg.admins.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No hay administradores asociados.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedOrg.admins.map((adm) => (
                        <div
                          key={adm.id}
                          className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                        >
                          <div>
                            <div className="font-medium">{adm.name}</div>
                            <div className="text-xs text-muted-foreground">{adm.email}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {adm.role}
                            </Badge>
                            <Badge variant="secondary" className="capitalize">
                              {adm.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Buildings List */}
                <div>
                  <h4 className="mb-2 text-sm font-semibold">
                    Edificios / Copropiedades ({selectedOrg.buildings.length})
                  </h4>
                  {selectedOrg.buildings.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Esta organización aún no tiene edificios.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedOrg.buildings.map((b) => (
                        <div
                          key={b.id}
                          className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                        >
                          <div>
                            <div className="font-medium">{b.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {b.address || 'Sin dirección'} · {b.total_units} unidades
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCop(b.monthly_fee)}</div>
                            {b.outstanding_balance > 0 && (
                              <div className="text-xs text-destructive">
                                Mora: {formatCop(b.outstanding_balance)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
