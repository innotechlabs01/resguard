'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Store,
  Plus,
  Search,
  Phone,
  MessageCircle,
  Tag,
  UtensilsCrossed,
  Wrench,
  ShoppingBag,
  Palette,
  MoreHorizontal,
  Star,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
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
import type { MarketplaceProduct } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'

const categoryConfig: Record<
  MarketplaceProduct['category'],
  { label: string; icon: typeof Store; className: string }
> = {
  food: { label: 'Comida', icon: UtensilsCrossed, className: 'text-warning border-warning/20 bg-warning/10' },
  services: { label: 'Servicios', icon: Wrench, className: 'text-info border-info/20 bg-info/10' },
  products: { label: 'Productos', icon: ShoppingBag, className: 'text-primary border-primary/20 bg-primary/10' },
  crafts: { label: 'Artesanias', icon: Palette, className: 'text-success border-success/20 bg-success/10' },
  other: { label: 'Otro', icon: MoreHorizontal, className: 'text-muted-foreground border-border bg-muted' },
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(price)

interface MarketplaceProps {
  products?: MarketplaceProduct[]
}

export function Marketplace({ products: propProducts }: MarketplaceProps = {}) {
  const { user } = useAuth()
  const [products, setProducts] = useState<MarketplaceProduct[]>(propProducts || [])
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<MarketplaceProduct['category'] | 'all'>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(!propProducts)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    category: 'services' as MarketplaceProduct['category'],
    contactPhone: '',
    whatsapp: '',
  })

  const fetchProducts = useCallback(async () => {
    if (propProducts || !user?.buildingId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/marketplace?buildingId=${encodeURIComponent(user.buildingId)}`)
      const data = await res.json()
      if (Array.isArray(data.products)) {
        setProducts(data.products.map((p: Record<string, unknown>) => ({
          id: p.id as string,
          sellerId: p.seller_id as string,
          sellerName: p.seller_name as string,
          sellerUnit: p.seller_unit as string,
          title: p.title as string,
          description: p.description as string,
          price: p.price as number,
          category: p.category as MarketplaceProduct['category'],
          available: p.available as boolean,
          contactPhone: p.contact_phone as string,
          whatsapp: p.whatsapp as string,
        })))
      }
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [propProducts, user?.buildingId])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const myProducts = products.filter((p) => p.sellerId === (user?.id ?? ''))
  const otherProducts = products.filter((p) => p.sellerId !== (user?.id ?? ''))

  const filtered = (list: MarketplaceProduct[]) =>
    list.filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
      const matchCat = catFilter === 'all' || p.category === catFilter
      return matchSearch && matchCat
    })

  const handleCreate = async () => {
    if (!form.title || !form.price || !user?.buildingId) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          building_id: user.buildingId,
          title: form.title,
          description: form.description || 'Sin descripción',
          price: Number.parseInt(form.price) || 0,
          category: form.category,
          contact_phone: form.contactPhone || undefined,
          whatsapp: form.whatsapp || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'No se pudo publicar el producto.')
        return
      }
      setShowCreate(false)
      setForm({ title: '', description: '', price: '', category: 'services', contactPhone: '', whatsapp: '' })
      await fetchProducts()
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const toggleAvailable = (id: string) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, available: !p.available } : p)))
  }

  const ProductCard = ({ product, isOwner = false }: { product: MarketplaceProduct; isOwner?: boolean }) => {
    const catCfg = categoryConfig[product.category]
    const CatIcon = catCfg.icon
    return (
      <Card className={cn('bg-card border-border hover:bg-muted/30 transition-colors', !product.available && 'opacity-60')}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border', catCfg.className)}>
                <CatIcon className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold text-foreground text-sm leading-tight">{product.title}</p>
                <p className="text-xs text-muted-foreground">
                  {isOwner ? 'Tu publicacion' : `Apto ${product.sellerUnit} · ${product.sellerName.split(' ')[0]}`}
                </p>
              </div>
            </div>
            <Badge variant="outline" className={catCfg.className}>{catCfg.label}</Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-primary">{formatPrice(product.price)}</span>
            {product.available ? (
              <Badge variant="outline" className="text-success border-success/20 bg-success/10 text-xs">
                <CheckCircle className="mr-1 h-3 w-3" /> Disponible
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground text-xs">
                <XCircle className="mr-1 h-3 w-3" /> No disponible
              </Badge>
            )}
          </div>
          {isOwner ? (
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => toggleAvailable(product.id)}
              >
                {product.available ? 'Pausar' : 'Activar'}
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 pt-1">
              {product.whatsapp && (
                <Button size="sm" className="flex-1 text-xs bg-success/20 text-success border-success/30 hover:bg-success/30">
                  <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                  WhatsApp
                </Button>
              )}
              <Button size="sm" variant="outline" className="flex-1 text-xs">
                <Phone className="mr-1.5 h-3.5 w-3.5" />
                Contactar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Emprendedores activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {new Set(products.map((p) => p.sellerId)).size}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Residentes con negocios</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Publicaciones totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{products.filter((p) => p.available).length}</div>
            <p className="text-xs text-muted-foreground mt-1">Activas ahora mismo</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mis publicaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{myProducts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Registradas por ti</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar producto o servicio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-input border-border text-foreground"
            />
          </div>
          <Tabs value={catFilter} onValueChange={(v) => setCatFilter(v as typeof catFilter)}>
            <TabsList className="bg-muted h-9">
              <TabsTrigger value="all" className="text-xs px-2">Todos</TabsTrigger>
              <TabsTrigger value="food" className="text-xs px-2">Comida</TabsTrigger>
              <TabsTrigger value="services" className="text-xs px-2">Servicios</TabsTrigger>
              <TabsTrigger value="crafts" className="text-xs px-2">Artesanias</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Publicar negocio
        </Button>
      </div>

      {/* My listings */}
      {myProducts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Star className="h-4 w-4 text-warning" />
            Mis publicaciones
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered(myProducts).map((p) => (
              <ProductCard key={p.id} product={p} isOwner />
            ))}
          </div>
        </div>
      )}

      {/* Other listings */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Store className="h-4 w-4 text-primary" />
          Negocios del edificio
        </h3>
        {filtered(otherProducts).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Store className="h-10 w-10 mb-3 opacity-30" />
            <p>No hay publicaciones disponibles</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered(otherProducts).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Publicar mi negocio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Categoria *</Label>
              <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v as MarketplaceProduct['category'] }))}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryConfig).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Nombre del producto/servicio *</Label>
              <Input
                placeholder="Ej: Almuerzos caseros, Clases de ingles..."
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="bg-input border-border text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Descripcion</Label>
              <Textarea
                placeholder="Describe tu producto o servicio, horarios, condiciones..."
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="bg-input border-border text-foreground resize-none min-h-[90px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Precio (COP) *</Label>
              <Input
                placeholder="Ej: 15000"
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                className="bg-input border-border text-foreground"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm">Telefono</Label>
                <Input
                  placeholder="+57 300..."
                  value={form.contactPhone}
                  onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))}
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm">WhatsApp</Label>
                <Input
                  placeholder="+57 300..."
                  value={form.whatsapp}
                  onChange={(e) => setForm((p) => ({ ...p, whatsapp: e.target.value }))}
                  className="bg-input border-border text-foreground"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!form.title || !form.price}>
              <Tag className="mr-2 h-4 w-4" />
              Publicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
