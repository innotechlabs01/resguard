'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  Store,
  Plus,
  Phone,
  Star,
  MessageSquare,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'

const categoryConfig: Record<string, { label: string; icon: string }> = {
  plumber: { label: 'Plomero', icon: '🔧' },
  electrician: { label: 'Electricista', icon: '⚡' },
  painter: { label: 'Pintor', icon: '🎨' },
  carpenter: { label: 'Carpintero', icon: '🪚' },
  appliance_repair: { label: 'Reparacion Electrodomesticos', icon: '🔨' },
  locksmith: { label: 'Cerrajero', icon: '🔐' },
  cleaning: { label: 'Limpieza', icon: '🧹' },
  gardening: { label: 'Jardineria', icon: '🌿' },
  other: { label: 'Otro', icon: '📋' },
}

interface Provider {
  id: string
  building_id: string
  name: string
  category: string
  phone: string
  whatsapp: string | null
  email: string | null
  description: string | null
  verified_by: string | null
  is_verified: boolean
  avg_rating: number
  total_reviews: number
  created_at: string
  updated_at: string
}

interface Review {
  id: string
  provider_id: string
  reviewer_id: string
  reviewer_name: string
  rating: number
  comment: string | null
  created_at: string
}

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          style={{ width: size, height: size }}
        />
      ))}
    </div>
  )
}

export function ProvidersPanel({ buildingId }: { buildingId: string }) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    category: 'plumber',
    phone: '',
    whatsapp: '',
    email: '',
    description: '',
  })

  // Review dialog
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [submittingReview, setSubmittingReview] = useState(false)

  const fetchProviders = useCallback(async () => {
    try {
      const params = new URLSearchParams({ buildingId })
      if (filterCategory !== 'all') params.set('category', filterCategory)

      const res = await fetch(`/api/providers?${params}`)
      if (res.ok) {
        const data = await res.json()
        setProviders(data.providers || [])
      }
    } catch (err) {
      console.error('Error fetching providers:', err)
    } finally {
      setLoading(false)
    }
  }, [buildingId, filterCategory])

  useEffect(() => { fetchProviders() }, [fetchProviders])

  // Fetch detail
  const openDetail = async (provider: Provider) => {
    setSelectedProvider(provider)
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/providers/${provider.id}`)
      if (res.ok) {
        const data = await res.json()
        setReviews(data.reviews || [])
      }
    } catch (err) {
      console.error('Error fetching detail:', err)
    } finally {
      setLoadingDetail(false)
    }
  }

  // Create provider
  const handleCreate = async () => {
    if (!createForm.name || !createForm.phone) return
    setCreating(true)
    try {
      const res = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...createForm, building_id: buildingId }),
      })
      if (res.ok) {
        setCreateDialogOpen(false)
        setCreateForm({ name: '', category: 'plumber', phone: '', whatsapp: '', email: '', description: '' })
        fetchProviders()
      }
    } catch (err) {
      console.error('Error creating provider:', err)
    } finally {
      setCreating(false)
    }
  }

  // Add review
  const handleAddReview = async () => {
    if (!selectedProvider || !reviewForm.comment.trim()) return
    setSubmittingReview(true)
    try {
      const res = await fetch(`/api/providers/${selectedProvider.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewForm),
      })
      if (res.ok) {
        const data = await res.json()
        setReviews(prev => [data.review, ...prev])
        setReviewDialogOpen(false)
        setReviewForm({ rating: 5, comment: '' })
        // Refresh provider to update rating
        openDetail(selectedProvider)
        fetchProviders()
      }
    } catch (err) {
      console.error('Error adding review:', err)
    } finally {
      setSubmittingReview(false)
    }
  }

  // Group providers by category
  const groupedProviders: Record<string, Provider[]> = {}
  for (const p of providers) {
    if (!groupedProviders[p.category]) groupedProviders[p.category] = []
    groupedProviders[p.category].push(p)
  }

  // Detail view
  if (selectedProvider) {
    const catCfg = categoryConfig[selectedProvider.category] || categoryConfig.other
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => { setSelectedProvider(null); setReviews([]); fetchProviders(); }} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>

        {/* Provider header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  {catCfg.icon} {selectedProvider.name}
                  {selectedProvider.is_verified && (
                    <Badge className="bg-green-100 text-green-800 gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Verificado
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{catCfg.label}</p>
              </div>
              <div className="flex items-center gap-2">
                <StarRating rating={Math.round(selectedProvider.avg_rating)} />
                <span className="text-sm text-muted-foreground">
                  {selectedProvider.avg_rating.toFixed(1)} ({selectedProvider.total_reviews} reviews)
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedProvider.description && (
              <p className="text-foreground">{selectedProvider.description}</p>
            )}
            <div className="flex flex-wrap gap-3">
              <a
                href={`tel:${selectedProvider.phone}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors"
              >
                <Phone className="h-4 w-4" />
                {selectedProvider.phone}
              </a>
              {selectedProvider.whatsapp && (
                <a
                  href={`https://wa.me/${selectedProvider.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-sm hover:bg-green-200 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  WhatsApp
                </a>
              )}
              {selectedProvider.email && (
                <a
                  href={`mailto:${selectedProvider.email}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors"
                >
                  {selectedProvider.email}
                </a>
              )}
            </div>
            {selectedProvider.verified_by && (
              <p className="text-xs text-muted-foreground">
                Verificado por: {selectedProvider.verified_by}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Reviews */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Resenas ({reviews.length})</CardTitle>
            <Button size="sm" onClick={() => setReviewDialogOpen(true)} className="gap-1">
              <Plus className="h-3 w-3" />
              Calificar
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingDetail ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No hay resenas aun</p>
            ) : (
              reviews.map(review => (
                <div key={review.id} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{review.reviewer_name}</span>
                      <StarRating rating={review.rating} size={12} />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString('es-CO')}
                    </span>
                  </div>
                  {review.comment && <p className="text-sm text-foreground">{review.comment}</p>}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Review Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Calificar Proveedor</DialogTitle>
              <DialogDescription>{selectedProvider.name}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Calificacion *</label>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                      className="p-0.5"
                    >
                      <Star
                        className={`h-6 w-6 ${star <= reviewForm.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Comentario *</label>
                <Textarea
                  value={reviewForm.comment}
                  onChange={e => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Describe tu experiencia con este proveedor..."
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleAddReview} disabled={submittingReview || !reviewForm.comment.trim()}>
                {submittingReview ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Enviar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // List view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Store className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Proveedores Verificados</h2>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Agregar Proveedor
          </Button>
        )}
      </div>

      {/* Category filter */}
      <Select value={filterCategory} onValueChange={setFilterCategory}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filtrar por categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las categorias</SelectItem>
          {Object.entries(categoryConfig).map(([key, cfg]) => (
            <SelectItem key={key} value={key}>{cfg.icon} {cfg.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Providers list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : providers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay proveedores registrados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedProviders).map(([category, catProviders]) => {
            const catCfg = categoryConfig[category] || categoryConfig.other
            return (
              <div key={category}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <span>{catCfg.icon}</span>
                  {catCfg.label}
                  <Badge variant="secondary" className="text-xs">{catProviders.length}</Badge>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {catProviders.map(provider => (
                    <Card
                      key={provider.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => openDetail(provider)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-foreground truncate">{provider.name}</h4>
                              {provider.is_verified && (
                                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <StarRating rating={Math.round(provider.avg_rating)} size={12} />
                              <span className="text-xs text-muted-foreground">
                                {provider.avg_rating.toFixed(1)} ({provider.total_reviews})
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {provider.phone}
                              </span>
                              {provider.whatsapp && (
                                <span className="text-green-600">WhatsApp</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Agregar Proveedor</DialogTitle>
            <DialogDescription>Registra un nuevo proveedor verificado</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Nombre *</label>
              <Input
                value={createForm.name}
                onChange={e => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Juan Perez"
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
                    {Object.entries(categoryConfig).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.icon} {cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Telefono *</label>
                <Input
                  value={createForm.phone}
                  onChange={e => setCreateForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Ej: 300 123 4567"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">WhatsApp</label>
                <Input
                  value={createForm.whatsapp}
                  onChange={e => setCreateForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                  placeholder="Ej: 57 300 123 4567"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input
                  value={createForm.email}
                  onChange={e => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Ej: proveedor@email.com"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Descripcion</label>
              <Textarea
                value={createForm.description}
                onChange={e => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Especialidades, experiencia, etc."
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating || !createForm.name || !createForm.phone}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
