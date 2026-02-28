'use client'

import { useState } from 'react'
import {
  Search,
  Car,
  User,
  Home,
  Calendar,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  KeyRound,
  Bike,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { mockTenants } from '@/lib/mock-data'
import type { Tenant } from '@/lib/types'

const vehicleTypeIcon = {
  car: Car,
  motorcycle: Bike,
  bicycle: Bike,
}

const vehicleTypeLabel = {
  car: 'Automovil',
  motorcycle: 'Motocicleta',
  bicycle: 'Bicicleta',
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

function TenantRow({ tenant }: { tenant: Tenant }) {
  const [expanded, setExpanded] = useState(false)
  const daysToEnd = Math.ceil((tenant.leaseEnd.getTime() - Date.now()) / 86400000)
  const isExpiringSoon = daysToEnd <= 60 && daysToEnd > 0
  const isExpired = daysToEnd <= 0

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header row */}
      <button
        type="button"
        className="w-full flex items-center gap-4 p-4 bg-card hover:bg-muted/30 transition-colors text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Unit badge */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Home className="h-5 w-5 text-primary" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground">{tenant.name}</span>
            <Badge variant="outline" className="text-xs bg-muted">
              Apto / {tenant.unit}
            </Badge>
            <Badge
              variant="outline"
              className={
                isExpired
                  ? 'text-destructive border-destructive/30 bg-destructive/10 text-xs'
                  : isExpiringSoon
                  ? 'text-warning border-warning/30 bg-warning/10 text-xs'
                  : 'text-success border-success/30 bg-success/10 text-xs'
              }
            >
              {isExpired ? (
                <><XCircle className="mr-1 h-3 w-3" />Vencido</>
              ) : (
                <><CheckCircle className="mr-1 h-3 w-3" />{daysToEnd} dias</>
              )}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Propietario: {tenant.ownerName} (Apto {tenant.ownerUnit}) &mdash; CC {tenant.documentId}
          </p>
        </div>

        {/* Vehicles count */}
        <div className="shrink-0 flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Car className="h-4 w-4" />
            <span>{tenant.vehicles.length} vehiculo{tenant.vehicles.length !== 1 ? 's' : ''}</span>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border bg-muted/20 p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Tenant contact */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Datos del inquilino</p>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                {tenant.phone}
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                {tenant.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                Contrato: {formatDate(tenant.leaseStart)} al {formatDate(tenant.leaseEnd)}
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <KeyRound className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                Canon: ${new Intl.NumberFormat('es-CO').format(tenant.monthlyRent)} / mes
              </div>
            </div>

            {/* Vehicles */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Vehiculos autorizados ({tenant.vehicles.length})
              </p>
              {tenant.vehicles.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Sin vehiculos registrados</p>
              ) : (
                tenant.vehicles.map((v) => {
                  const VIcon = vehicleTypeIcon[v.type]
                  return (
                    <div
                      key={v.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 shrink-0">
                        <VIcon className="h-4 w-4 text-success" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-foreground tracking-widest">
                            {v.plate}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {vehicleTypeLabel[v.type]}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {v.brand} {v.model} &mdash; {v.color}
                          {v.parkingSpot && <span className="ml-2 text-primary">Cupo: {v.parkingSpot}</span>}
                        </p>
                      </div>
                      <Badge className="bg-success/10 text-success border-success/30 shrink-0 text-xs">
                        Autorizado
                      </Badge>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function InquilinosPanel() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expiring'>('all')

  const filtered = mockTenants.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.unit.toLowerCase().includes(search.toLowerCase()) ||
      t.vehicles.some((v) => v.plate.toLowerCase().includes(search.toLowerCase()))
    const daysLeft = Math.ceil((t.leaseEnd.getTime() - Date.now()) / 86400000)
    if (filterStatus === 'active') return matchSearch && daysLeft > 60 && t.status === 'active'
    if (filterStatus === 'expiring') return matchSearch && daysLeft <= 60
    return matchSearch
  })

  const totalVehicles = mockTenants.reduce((acc, t) => acc + t.vehicles.length, 0)
  const expiringSoon = mockTenants.filter((t) => {
    const d = Math.ceil((t.leaseEnd.getTime() - Date.now()) / 86400000)
    return d <= 60 && d > 0
  }).length

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Inquilinos Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{mockTenants.filter((t) => t.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground mt-0.5">En el edificio</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Vehiculos Registrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{totalVehicles}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Con acceso autorizado</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Contratos por Vencer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${expiringSoon > 0 ? 'text-warning' : 'text-foreground'}`}>
              {expiringSoon}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Proximos 60 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Search + filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, apto o placa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-input border-border text-foreground"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'active', 'expiring'] as const).map((f) => (
            <Button
              key={f}
              variant={filterStatus === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus(f)}
              className="text-xs"
            >
              {f === 'all' ? 'Todos' : f === 'active' ? 'Vigentes' : 'Por vencer'}
            </Button>
          ))}
        </div>
      </div>

      {/* Info note for security */}
      <div className="rounded-lg border border-info/30 bg-info/5 px-4 py-3 flex items-start gap-3">
        <User className="h-4 w-4 text-info shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Consulta esta lista para verificar si un vehiculo o persona tiene autorizacion de residir
          en el edificio como <strong className="text-foreground">inquilino</strong>. Las placas en verde
          tienen acceso al parqueadero asignado por su propietario.
        </p>
      </div>

      {/* Tenant list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <User className="h-10 w-10 mb-3 opacity-30" />
            <p>No se encontraron inquilinos</p>
          </div>
        ) : (
          filtered.map((tenant) => <TenantRow key={tenant.id} tenant={tenant} />)
        )}
      </div>
    </div>
  )
}
