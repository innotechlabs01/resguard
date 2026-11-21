'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Home,
  Car,
  Plus,
  User,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Key,
  FileText,
  CheckCircle,
  Clock,
  MapPin,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  UserPlus,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { Tenant, RentalListing, TenantVehicle } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'

const formatPrice = (price: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(price)

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)

const vehicleTypeLabel: Record<TenantVehicle['type'], string> = {
  car: 'Automovil',
  motorcycle: 'Moto',
  bicycle: 'Bicicleta',
}

function normalizeTenant(raw: Tenant | Record<string, unknown>): Tenant {
  const t = raw as Record<string, unknown>
  const leaseStartVal = t.leaseStart ?? t.lease_start
  const leaseEndVal = t.leaseEnd ?? t.lease_end
  return {
    id: String(t.id ?? ''),
    name: String(t.name ?? ''),
    documentId: String(t.documentId ?? t.document_id ?? ''),
    phone: String(t.phone ?? ''),
    email: String(t.email ?? ''),
    unit: String(t.unit ?? ''),
    buildingId: String(t.buildingId ?? t.building_id ?? ''),
    ownerId: String(t.ownerId ?? t.owner_id ?? ''),
    ownerName: String(t.ownerName ?? t.owner_name ?? ''),
    ownerUnit: String(t.ownerUnit ?? t.owner_unit ?? ''),
    leaseStart: leaseStartVal instanceof Date ? leaseStartVal : new Date(String(leaseStartVal ?? Date.now())),
    leaseEnd: leaseEndVal instanceof Date ? leaseEndVal : new Date(String(leaseEndVal ?? Date.now())),
    monthlyRent: Number(t.monthlyRent ?? t.monthly_rent ?? 0),
    depositPaid: Number(t.depositPaid ?? t.deposit_paid ?? 0),
    status: (t.status as Tenant['status']) || 'active',
    vehicles: Array.isArray(t.vehicles) ? (t.vehicles as TenantVehicle[]) : [],
  }
}

interface AlquilerPanelProps {
  tenants?: (Tenant | Record<string, unknown>)[]
  listings?: RentalListing[]
  onTenantsChange?: (tenants: Tenant[]) => void
}

export function AlquilerPanel({ tenants: propTenants, listings: propListings, onTenantsChange }: AlquilerPanelProps = {}) {
  const { user } = useAuth()
  const myId = user?.id ?? ''

  const [tenants, setTenants] = useState<Tenant[]>(() =>
    (propTenants || []).map(normalizeTenant).filter((t) => !myId || t.ownerId === myId)
  )
  const [listings, setListings] = useState<RentalListing[]>(
    (propListings || []).filter((l) => l.ownerId === myId)
  )
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [showTenantDetail, setShowTenantDetail] = useState(false)
  const [showAddTenant, setShowAddTenant] = useState(false)
  const [savingTenant, setSavingTenant] = useState(false)
  const [deletingTenantId, setDeletingTenantId] = useState<string | null>(null)
  const [tenantError, setTenantError] = useState<string | null>(null)
  const [tenantForm, setTenantForm] = useState({
    name: '',
    document_id: '',
    email: '',
    phone: '',
    unit: '',
    monthly_rent: '',
    lease_start: '',
    lease_end: '',
    send_invite: true,
  })
  const [showAddListing, setShowAddListing] = useState(false)
  const [loading, setLoading] = useState(!propListings)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [listingForm, setListingForm] = useState({
    type: 'apartment' as RentalListing['type'],
    title: '',
    description: '',
    price: '',
    period: 'monthly' as RentalListing['period'],
    rooms: '',
    bathrooms: '',
    area: '',
    contactPhone: '',
    availableFrom: '',
    amenities: '',
  })

  const fetchListings = useCallback(async () => {
    if (propListings || !user?.buildingId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/rentals?buildingId=${encodeURIComponent(user.buildingId)}`)
      const data = await res.json()
      if (Array.isArray(data.listings)) {
        setListings(data.listings.map((l: Record<string, unknown>) => ({
          id: l.id as string,
          type: l.type as RentalListing['type'],
          ownerId: l.owner_id as string,
          ownerName: l.owner_name as string,
          ownerUnit: l.owner_unit as string,
          buildingId: l.building_id as string,
          title: l.title as string,
          description: l.description as string,
          price: l.price as number,
          currency: (l.currency as string) || 'COP',
          period: l.period as RentalListing['period'],
          available: l.available as boolean,
          availableFrom: l.available_from ? new Date(l.available_from as string) : undefined,
          rooms: l.rooms as number || undefined,
          bathrooms: l.bathrooms as number || undefined,
          area: l.area as number || undefined,
          contactPhone: l.contact_phone as string,
          amenities: (l.amenities as string[]) || [],
          status: (l.status as string) || 'active',
        })).filter((l: RentalListing) => l.ownerId === myId))
      }
    } catch {
      setListings([])
    } finally {
      setLoading(false)
    }
  }, [propListings, user?.buildingId, myId])

  useEffect(() => {
    if (propTenants) {
      setTenants(propTenants.map(normalizeTenant).filter((t) => !myId || t.ownerId === myId))
    }
  }, [propTenants, myId])

  const fetchTenants = useCallback(async () => {
    if (!user?.buildingId) return
    try {
      const res = await fetch(`/api/tenants?buildingId=${encodeURIComponent(user.buildingId)}`)
      const data = await res.json()
      if (res.ok && Array.isArray(data.tenants)) {
        const normalized = data.tenants
          .map((t: Record<string, unknown>) => normalizeTenant(t))
          .filter((t: Tenant) => !myId || t.ownerId === myId)
        setTenants(normalized)
        onTenantsChange?.(normalized)
      }
    } catch {
      // Keep existing list on transient error
    }
  }, [user?.buildingId, myId, onTenantsChange])

  const handleAddTenant = async () => {
    if (!user?.buildingId) return
    if (
      !tenantForm.name.trim() ||
      !tenantForm.document_id.trim() ||
      !tenantForm.email.trim() ||
      !tenantForm.phone.trim() ||
      !tenantForm.unit.trim() ||
      !tenantForm.monthly_rent.trim() ||
      !tenantForm.lease_start ||
      !tenantForm.lease_end
    ) {
      setTenantError('Por favor completa todos los campos obligatorios.')
      return
    }

    setSavingTenant(true)
    setTenantError(null)
    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          building_id: user.buildingId,
          name: tenantForm.name.trim(),
          document_id: tenantForm.document_id.trim(),
          email: tenantForm.email.trim(),
          phone: tenantForm.phone.trim(),
          unit: tenantForm.unit.trim(),
          monthly_rent: parseInt(tenantForm.monthly_rent.replace(/\D/g, ''), 10) || 0,
          lease_start: tenantForm.lease_start,
          lease_end: tenantForm.lease_end,
          send_invite: tenantForm.send_invite,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = data.error || 'No se pudo registrar el inquilino.'
        setTenantError(msg)
        toast.error(msg)
        return
      }
      toast.success(data.message || 'Inquilino registrado exitosamente')
      setShowAddTenant(false)
      setTenantForm({
        name: '',
        document_id: '',
        email: '',
        phone: '',
        unit: '',
        monthly_rent: '',
        lease_start: '',
        lease_end: '',
        send_invite: true,
      })
      await fetchTenants()
    } catch {
      setTenantError('Error de conexión. Intenta de nuevo.')
      toast.error('Error de conexión. Intenta de nuevo.')
    } finally {
      setSavingTenant(false)
    }
  }

  const handleDeleteTenant = async (tenant: Tenant) => {
    setDeletingTenantId(tenant.id)
    try {
      const res = await fetch(`/api/tenants?id=${encodeURIComponent(tenant.id)}`, {
        method: 'DELETE',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'No se pudo eliminar el inquilino.')
        return
      }
      toast.success('Inquilino eliminado')
      await fetchTenants()
    } catch {
      toast.error('Error de conexión al eliminar inquilino.')
    } finally {
      setDeletingTenantId(null)
    }
  }

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  const handleAddListing = async () => {
    if (!listingForm.title || !listingForm.price || !user?.buildingId) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          building_id: user.buildingId,
          type: listingForm.type,
          title: listingForm.title,
          description: listingForm.description || 'Sin descripción',
          price: parseInt(listingForm.price.replace(/\D/g, '')) || 0,
          period: listingForm.period,
          rooms: listingForm.rooms ? parseInt(listingForm.rooms) : undefined,
          bathrooms: listingForm.bathrooms ? parseInt(listingForm.bathrooms) : undefined,
          area: listingForm.area ? parseInt(listingForm.area) : undefined,
          contact_phone: listingForm.contactPhone || undefined,
          available_from: listingForm.availableFrom || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'No se pudo publicar el anuncio.')
        return
      }
      setShowAddListing(false)
      setListingForm({ type: 'apartment', title: '', description: '', price: '', period: 'monthly', rooms: '', bathrooms: '', area: '', contactPhone: '', availableFrom: '', amenities: '' })
      await fetchListings()
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const leaseExpiringSoon = tenants.filter((t) => {
    const daysLeft = Math.floor((t.leaseEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return daysLeft <= 60 && daysLeft > 0
  })

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {leaseExpiringSoon.length > 0 && (
        <Card className="bg-warning/5 border-warning/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
              <div>
                <p className="text-sm font-semibold text-warning">Contratos proximos a vencer</p>
                <p className="text-xs text-muted-foreground">
                  {leaseExpiringSoon.map((t) => t.name).join(', ')} · Contacta a tu administrador para renovar.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inquilinos activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{tenants.filter((t) => t.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground mt-1">Contratos vigentes</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ingreso mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatPrice(tenants.filter((t) => t.status === 'active').reduce((acc, t) => acc + t.monthlyRent, 0))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Por arrendamientos</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vehiculos registrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {tenants.flatMap((t) => t.vehicles).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">En control de seguridad</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inquilinos">
        <TabsList className="bg-muted">
          <TabsTrigger value="inquilinos">
            <User className="mr-2 h-4 w-4" />
            Mis Inquilinos ({tenants.length})
          </TabsTrigger>
          <TabsTrigger value="publicaciones">
            <Home className="mr-2 h-4 w-4" />
            Mis Publicaciones ({listings.length})
          </TabsTrigger>
          <TabsTrigger value="todos">
            <Eye className="mr-2 h-4 w-4" />
            Disponibles en edificio
          </TabsTrigger>
        </TabsList>

        {/* Inquilinos */}
        <TabsContent value="inquilinos" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button onClick={() => { setTenantError(null); setShowAddTenant(true) }}>
              <UserPlus className="mr-2 h-4 w-4" />
              Registrar / Invitar Inquilino
            </Button>
          </div>
          {tenants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
              <User className="h-10 w-10 mb-3 opacity-30" />
              <p>No tienes inquilinos registrados</p>
              <p className="text-xs mt-1 mb-4">Registra a tu arrendatario y envíale acceso a Web, PWA y App Móvil</p>
              <Button variant="outline" onClick={() => { setTenantError(null); setShowAddTenant(true) }}>
                <UserPlus className="mr-2 h-4 w-4" />
                Registrar / Invitar Inquilino
              </Button>
            </div>
          ) : (
            tenants.map((tenant) => {
              const daysLeft = Math.floor((tenant.leaseEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              const isExpiringSoon = daysLeft <= 60 && daysLeft > 0
              return (
                <Card key={tenant.id} className={cn('bg-card border-border', isExpiringSoon && 'border-warning/40')}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
                          <User className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{tenant.name}</p>
                          <p className="text-xs text-muted-foreground">CC {tenant.documentId} · {tenant.unit}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Phone className="h-3 w-3" />
                            {tenant.phone}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant="outline"
                          className={
                            tenant.status === 'active'
                              ? 'text-success border-success/20 bg-success/10'
                              : 'text-muted-foreground'
                          }
                        >
                          {tenant.status === 'active' ? 'Activo' : 'Inactivo'}
                        </Badge>
                        {isExpiringSoon && (
                          <Badge variant="outline" className="text-warning border-warning/30 bg-warning/10 text-xs">
                            Vence en {daysLeft} dias
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-3">
                      <div className="rounded-lg bg-muted p-2 text-center">
                        <p className="text-xs text-muted-foreground">Canon mensual</p>
                        <p className="text-sm font-bold text-success">{formatPrice(tenant.monthlyRent)}</p>
                      </div>
                      <div className="rounded-lg bg-muted p-2 text-center">
                        <p className="text-xs text-muted-foreground">Inicio contrato</p>
                        <p className="text-sm font-semibold text-foreground">{formatDate(tenant.leaseStart)}</p>
                      </div>
                      <div className="rounded-lg bg-muted p-2 text-center">
                        <p className="text-xs text-muted-foreground">Fin contrato</p>
                        <p className={cn('text-sm font-semibold', isExpiringSoon ? 'text-warning' : 'text-foreground')}>
                          {formatDate(tenant.leaseEnd)}
                        </p>
                      </div>
                    </div>

                    {/* Vehicles */}
                    {tenant.vehicles.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                          <Car className="h-3.5 w-3.5" />
                          Vehiculos registrados para control de acceso
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {tenant.vehicles.map((v) => (
                            <div
                              key={v.id}
                              className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-1.5"
                            >
                              <Car className="h-3.5 w-3.5 text-muted-foreground" />
                              <div>
                                <span className="text-xs font-mono font-bold text-foreground">{v.plate}</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  {v.color} {v.brand} {v.model}
                                </span>
                              </div>
                              {v.parkingSpot && (
                                <Badge variant="outline" className="text-xs ml-1">
                                  <MapPin className="h-2.5 w-2.5 mr-1" />
                                  {v.parkingSpot}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => { setSelectedTenant(tenant); setShowTenantDetail(true) }}
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        Ver detalle
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs text-destructive hover:bg-destructive/10"
                        disabled={deletingTenantId === tenant.id}
                        onClick={() => handleDeleteTenant(tenant)}
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        {deletingTenantId === tenant.id ? 'Eliminando...' : 'Eliminar / Revocar'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        {/* My Listings */}
        <TabsContent value="publicaciones" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddListing(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva publicacion
            </Button>
          </div>
          {listings.length === 0 ? (
            <EmptyState
              icon={Home}
              title="No tienes anuncios de alquiler"
              description="Publica un apartamento, habitación, parqueadero o bodega para que otros vecinos la encuentren."
              actionLabel="Publicar anuncio"
              onAction={() => setShowAddListing(true)}
              compact
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {listings.map((listing) => (
                <Card key={listing.id} className="bg-card border-border">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {listing.type === 'apartment' ? (
                          <Home className="h-5 w-5 text-primary" />
                        ) : (
                          <Car className="h-5 w-5 text-info" />
                        )}
                        <div>
                          <p className="font-semibold text-foreground text-sm">{listing.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {listing.type === 'apartment' ? 'Apartamento' : 'Parqueadero'} ·{' '}
                            {listing.period === 'monthly' ? 'Mensual' : 'Diario'}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          listing.status === 'active'
                            ? 'text-success border-success/20 bg-success/10'
                            : listing.status === 'rented'
                            ? 'text-info border-info/20 bg-info/10'
                            : 'text-muted-foreground border-border bg-muted'
                        }
                      >
                        {listing.status === 'active' ? 'Activa' : listing.status === 'rented' ? 'Arrendada' : 'Pausada'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{listing.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">
                        {formatPrice(listing.price)}
                        <span className="text-xs font-normal text-muted-foreground">/{listing.period === 'monthly' ? 'mes' : 'dia'}</span>
                      </span>
                      {listing.type === 'apartment' && listing.rooms && (
                        <span className="text-xs text-muted-foreground">
                          {listing.rooms} hab · {listing.bathrooms} ban · {listing.area}m²
                        </span>
                      )}
                    </div>
                    {listing.amenities && listing.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {listing.amenities.slice(0, 3).map((a) => (
                          <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>
                        ))}
                        {listing.amenities.length > 3 && (
                          <Badge variant="secondary" className="text-xs">+{listing.amenities.length - 3}</Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* All listings in building */}
        <TabsContent value="todos" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {(propListings || []).filter((l: any) => l.available).map((listing: any) => (
              <Card key={listing.id} className="bg-card border-border">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {listing.type === 'apartment' ? (
                        <Home className="h-5 w-5 text-primary" />
                      ) : (
                        <Car className="h-5 w-5 text-info" />
                      )}
                      <div>
                        <p className="font-semibold text-foreground text-sm">{listing.title}</p>
                        <p className="text-xs text-muted-foreground">Apto {listing.ownerUnit} · {listing.ownerName.split(' ')[0]}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-success border-success/20 bg-success/10 text-xs">
                      Disponible
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{listing.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-primary">
                      {formatPrice(listing.price)}
                      <span className="text-xs font-normal text-muted-foreground">/{listing.period === 'monthly' ? 'mes' : 'dia'}</span>
                    </span>
                    <Button size="sm" variant="outline" className="text-xs">
                      <Phone className="mr-1.5 h-3.5 w-3.5" />
                      Contactar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Tenant detail dialog */}
      {selectedTenant && (
        <Dialog open={showTenantDetail} onOpenChange={setShowTenantDetail}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground">Detalle del Inquilino</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <User className="h-7 w-7 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-lg">{selectedTenant.name}</p>
                  <p className="text-sm text-muted-foreground">CC {selectedTenant.documentId}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{selectedTenant.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground truncate">{selectedTenant.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">Unidad: {selectedTenant.unit}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{formatPrice(selectedTenant.monthlyRent)}/mes</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">Inicio: {formatDate(selectedTenant.leaseStart)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">Fin: {formatDate(selectedTenant.leaseEnd)}</span>
                </div>
              </div>
              {selectedTenant.vehicles.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Vehiculos registrados
                  </p>
                  <div className="space-y-2">
                    {selectedTenant.vehicles.map((v) => (
                      <div key={v.id} className="flex items-center justify-between rounded-lg border border-border bg-muted px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <span className="font-mono font-bold text-foreground text-sm">{v.plate}</span>
                            <p className="text-xs text-muted-foreground">{v.color} {v.brand} {v.model} · {vehicleTypeLabel[v.type]}</p>
                          </div>
                        </div>
                        {v.parkingSpot && (
                          <Badge variant="outline" className="text-xs">
                            {v.parkingSpot}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTenantDetail(false)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Listing Dialog */}
      <Dialog open={showAddListing} onOpenChange={setShowAddListing}>
        <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Publicar arrendamiento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Tabs value={listingForm.type} onValueChange={(v) => setListingForm((p) => ({ ...p, type: v as RentalListing['type'] }))}>
              <TabsList className="w-full bg-muted">
                <TabsTrigger value="apartment" className="flex-1">
                  <Home className="mr-2 h-4 w-4" /> Apartamento
                </TabsTrigger>
                <TabsTrigger value="parking" className="flex-1">
                  <Car className="mr-2 h-4 w-4" /> Parqueadero
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Titulo *</Label>
              <Input placeholder="Ej: Apto 301 disponible" value={listingForm.title} onChange={(e) => setListingForm((p) => ({ ...p, title: e.target.value }))} className="bg-input border-border text-foreground" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Descripcion</Label>
              <Textarea placeholder="Descripcion detallada..." value={listingForm.description} onChange={(e) => setListingForm((p) => ({ ...p, description: e.target.value }))} className="bg-input border-border text-foreground resize-none min-h-[80px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm">Precio (COP) *</Label>
                <Input placeholder="1500000" value={listingForm.price} onChange={(e) => setListingForm((p) => ({ ...p, price: e.target.value }))} className="bg-input border-border text-foreground" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm">Periodo</Label>
                <Select value={listingForm.period} onValueChange={(v) => setListingForm((p) => ({ ...p, period: v as RentalListing['period'] }))}>
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="daily">Diario</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {listingForm.type === 'apartment' && (
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm">Habitaciones</Label>
                  <Input placeholder="3" value={listingForm.rooms} onChange={(e) => setListingForm((p) => ({ ...p, rooms: e.target.value }))} className="bg-input border-border text-foreground" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm">Banos</Label>
                  <Input placeholder="2" value={listingForm.bathrooms} onChange={(e) => setListingForm((p) => ({ ...p, bathrooms: e.target.value }))} className="bg-input border-border text-foreground" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm">Area (m²)</Label>
                  <Input placeholder="80" value={listingForm.area} onChange={(e) => setListingForm((p) => ({ ...p, area: e.target.value }))} className="bg-input border-border text-foreground" />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Comodidades (separadas por coma)</Label>
              <Input placeholder="WiFi, Amoblado, Lavadora..." value={listingForm.amenities} onChange={(e) => setListingForm((p) => ({ ...p, amenities: e.target.value }))} className="bg-input border-border text-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm">Disponible desde</Label>
                <Input type="date" value={listingForm.availableFrom} onChange={(e) => setListingForm((p) => ({ ...p, availableFrom: e.target.value }))} className="bg-input border-border text-foreground" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm">Telefono contacto</Label>
                <Input placeholder="+57 300..." value={listingForm.contactPhone} onChange={(e) => setListingForm((p) => ({ ...p, contactPhone: e.target.value }))} className="bg-input border-border text-foreground" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddListing(false)}>Cancelar</Button>
            <Button onClick={handleAddListing} disabled={!listingForm.title || !listingForm.price}>
              <Plus className="mr-2 h-4 w-4" />
              Publicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Register / Invite Tenant Dialog */}
      <Dialog open={showAddTenant} onOpenChange={setShowAddTenant}>
        <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Registrar / Invitar Inquilino</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {tenantError && (
              <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                {tenantError}
              </p>
            )}
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Nombre completo *</Label>
              <Input
                placeholder="Ej: Laura Gómez"
                value={tenantForm.name}
                onChange={(e) => setTenantForm((p) => ({ ...p, name: e.target.value }))}
                className="bg-input border-border text-foreground"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm">Cédula / Documento *</Label>
                <Input
                  placeholder="1020304050"
                  value={tenantForm.document_id}
                  onChange={(e) => setTenantForm((p) => ({ ...p, document_id: e.target.value }))}
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm">Unidad / Apto *</Label>
                <Input
                  placeholder="Apto 301"
                  value={tenantForm.unit}
                  onChange={(e) => setTenantForm((p) => ({ ...p, unit: e.target.value }))}
                  className="bg-input border-border text-foreground"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm">Correo electrónico *</Label>
                <Input
                  type="email"
                  placeholder="inquilino@correo.com"
                  value={tenantForm.email}
                  onChange={(e) => setTenantForm((p) => ({ ...p, email: e.target.value }))}
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm">Teléfono *</Label>
                <Input
                  placeholder="+57 300 000 0000"
                  value={tenantForm.phone}
                  onChange={(e) => setTenantForm((p) => ({ ...p, phone: e.target.value }))}
                  className="bg-input border-border text-foreground"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Canon mensual (COP) *</Label>
              <Input
                placeholder="1800000"
                value={tenantForm.monthly_rent}
                onChange={(e) => setTenantForm((p) => ({ ...p, monthly_rent: e.target.value }))}
                className="bg-input border-border text-foreground"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm">Inicio contrato *</Label>
                <Input
                  type="date"
                  value={tenantForm.lease_start}
                  onChange={(e) => setTenantForm((p) => ({ ...p, lease_start: e.target.value }))}
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm">Fin contrato *</Label>
                <Input
                  type="date"
                  value={tenantForm.lease_end}
                  onChange={(e) => setTenantForm((p) => ({ ...p, lease_end: e.target.value }))}
                  className="bg-input border-border text-foreground"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 pt-1 cursor-pointer text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={tenantForm.send_invite}
                onChange={(e) => setTenantForm((p) => ({ ...p, send_invite: e.target.checked }))}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              Enviar invitación por correo para acceso a Web, PWA y App Móvil
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTenant(false)} disabled={savingTenant}>
              Cancelar
            </Button>
            <Button onClick={handleAddTenant} disabled={savingTenant}>
              <UserPlus className="mr-2 h-4 w-4" />
              {savingTenant ? 'Registrando...' : 'Registrar e Invitar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
