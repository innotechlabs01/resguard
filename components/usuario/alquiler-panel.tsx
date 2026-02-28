'use client'

import { useState } from 'react'
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
import { mockTenants, mockRentalListings } from '@/lib/mock-data'
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

export function AlquilerPanel() {
  const { user } = useAuth()
  const myId = user?.id ?? 'usuario-1'

  const [tenants, setTenants] = useState<Tenant[]>(
    mockTenants.filter((t) => t.ownerId === myId)
  )
  const [listings, setListings] = useState<RentalListing[]>(
    mockRentalListings.filter((l) => l.ownerId === myId)
  )
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [showTenantDetail, setShowTenantDetail] = useState(false)
  const [showAddListing, setShowAddListing] = useState(false)
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

  const handleAddListing = () => {
    if (!listingForm.title || !listingForm.price) return
    const listing: RentalListing = {
      id: `rental-${Date.now()}`,
      type: listingForm.type,
      ownerId: myId,
      ownerName: user?.name ?? 'Residente',
      ownerUnit: '301',
      buildingId: 'building-1',
      title: listingForm.title,
      description: listingForm.description,
      price: parseInt(listingForm.price.replace(/\D/g, '')) || 0,
      currency: 'COP',
      period: listingForm.period,
      available: true,
      availableFrom: listingForm.availableFrom ? new Date(listingForm.availableFrom) : new Date(),
      rooms: listingForm.rooms ? parseInt(listingForm.rooms) : undefined,
      bathrooms: listingForm.bathrooms ? parseInt(listingForm.bathrooms) : undefined,
      area: listingForm.area ? parseInt(listingForm.area) : undefined,
      contactPhone: listingForm.contactPhone,
      amenities: listingForm.amenities.split(',').map((a) => a.trim()).filter(Boolean),
      status: 'active',
    }
    setListings((prev) => [listing, ...prev])
    setShowAddListing(false)
    setListingForm({ type: 'apartment', title: '', description: '', price: '', period: 'monthly', rooms: '', bathrooms: '', area: '', contactPhone: '', availableFrom: '', amenities: '' })
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
          {tenants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
              <User className="h-10 w-10 mb-3 opacity-30" />
              <p>No tienes inquilinos registrados</p>
              <p className="text-xs mt-1">Contacta al administrador para registrar un arrendatario</p>
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
            <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
              <Home className="h-10 w-10 mb-3 opacity-30" />
              <p>No tienes publicaciones</p>
            </div>
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
            {mockRentalListings.filter((l) => l.available).map((listing) => (
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
    </div>
  )
}
