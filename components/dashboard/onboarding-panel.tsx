'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/lib/auth-context'
import {
  UserPlus,
  CheckCircle2,
  Circle,
  Clock,
  Users,
  Loader2,
  ArrowLeft,
  PartyPopper,
  Plus,
} from 'lucide-react'

const onboardingItems = [
  { key: 'signed_regulation', label: 'Firmar reglamento', icon: '📋' },
  { key: 'received_keys', label: 'Recibido llaves', icon: '🔑' },
  { key: 'met_vigilante', label: 'Conocer vigilante', icon: '🛡️' },
  { key: 'met_admin', label: 'Conocer administrador', icon: '👤' },
  { key: 'parking_assigned', label: 'Parqueadero asignado', icon: '🅿️' },
  { key: 'wifi_configured', label: 'WiFi configurado', icon: '📶' },
  { key: 'emergency_numbers', label: 'Numeros de emergencia', icon: '🚨' },
] as const

type OnboardingItemKey = typeof onboardingItems[number]['key']

interface OnboardingChecklist {
  id: string
  building_id: string
  user_id: string
  user_name: string
  user_unit: string | null
  status: string
  signed_regulation: boolean
  received_keys: boolean
  met_vigilante: boolean
  met_admin: boolean
  parking_assigned: boolean
  wifi_configured: boolean
  emergency_numbers: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
}

// ── Main Panel ──

export function OnboardingPanel({ buildingId }: { buildingId: string }) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  const [checklists, setChecklists] = useState<OnboardingChecklist[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChecklist, setSelectedChecklist] = useState<OnboardingChecklist | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ user_id: '', user_name: '', user_unit: '' })
  const [creating, setCreating] = useState(false)

  // Fetch checklists
  const fetchChecklists = useCallback(async () => {
    try {
      const res = await fetch(`/api/onboarding?buildingId=${buildingId}`)
      if (res.ok) {
        const data = await res.json()
        setChecklists(data.checklists || [])
      }
    } catch (err) {
      console.error('Error fetching onboarding:', err)
    } finally {
      setLoading(false)
    }
  }, [buildingId])

  useEffect(() => { fetchChecklists() }, [fetchChecklists])

  // Get completed count
  const getCompletedCount = (checklist: OnboardingChecklist) => {
    return onboardingItems.filter(item => checklist[item.key as OnboardingItemKey]).length
  }

  // Toggle item
  const handleToggleItem = async (checklistId: string, itemKey: string, currentValue: boolean) => {
    setUpdating(itemKey)
    try {
      const res = await fetch(`/api/onboarding/${checklistId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: itemKey, value: !currentValue }),
      })
      if (res.ok) {
        const data = await res.json()
        setChecklists(prev => prev.map(c => c.id === checklistId ? data.checklist : c))
        if (selectedChecklist?.id === checklistId) {
          setSelectedChecklist(data.checklist)
        }
      }
    } catch (err) {
      console.error('Error updating item:', err)
    } finally {
      setUpdating(null)
    }
  }

  // Create checklist
  const handleCreate = async () => {
    if (!createForm.user_id || !createForm.user_name) return
    setCreating(true)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          building_id: buildingId,
          user_id: createForm.user_id,
          user_name: createForm.user_name,
          user_unit: createForm.user_unit || null,
        }),
      })
      if (res.ok) {
        setCreateDialogOpen(false)
        setCreateForm({ user_id: '', user_name: '', user_unit: '' })
        fetchChecklists()
      }
    } catch (err) {
      console.error('Error creating checklist:', err)
    } finally {
      setCreating(false)
    }
  }

  // Stats
  const completedCount = checklists.filter(c => c.status === 'completed').length
  const pendingCount = checklists.filter(c => c.status === 'in_progress').length

  // ── Detail View (Resident) ──

  if (selectedChecklist && !isAdmin) {
    const allCompleted = getCompletedCount(selectedChecklist) === onboardingItems.length

    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => { setSelectedChecklist(null); fetchChecklists(); }} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" /> Mi Checklist de Bienvenida
            </CardTitle>
            <CardDescription>
              {getCompletedCount(selectedChecklist)}/{onboardingItems.length} items completados
            </CardDescription>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${(getCompletedCount(selectedChecklist) / onboardingItems.length) * 100}%` }}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {allCompleted ? (
              <div className="text-center py-8">
                <PartyPopper className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
                <p className="text-2xl font-bold text-foreground">Bienvenido!</p>
                <p className="text-muted-foreground mt-2">Has completado todo tu checklist de bienvenida</p>
              </div>
            ) : (
              onboardingItems.map(item => {
                const isChecked = selectedChecklist[item.key as OnboardingItemKey]
                return (
                  <button
                    key={item.key}
                    onClick={() => handleToggleItem(selectedChecklist.id, item.key, isChecked)}
                    disabled={updating === item.key}
                    className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-colors ${
                      isChecked
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white border-border hover:bg-muted/50'
                    }`}
                  >
                    {updating === item.key ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : isChecked ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className="text-lg mr-2">{item.icon}</span>
                    <span className={`text-sm font-medium ${isChecked ? 'text-green-700 line-through' : 'text-foreground'}`}>
                      {item.label}
                    </span>
                  </button>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Detail View (Admin) ──

  if (selectedChecklist && isAdmin) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => { setSelectedChecklist(null); fetchChecklists(); }} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{selectedChecklist.user_name}</CardTitle>
                <CardDescription className="mt-1">
                  {selectedChecklist.user_unit && <span>Unidad {selectedChecklist.user_unit} · </span>}
                  {getCompletedCount(selectedChecklist)}/{onboardingItems.length} items completados
                </CardDescription>
              </div>
              <Badge className={selectedChecklist.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                {selectedChecklist.status === 'completed' ? 'Completado' : 'En Progreso'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="w-full bg-muted rounded-full h-3 mb-4">
              <div
                className="bg-primary h-3 rounded-full transition-all"
                style={{ width: `${(getCompletedCount(selectedChecklist) / onboardingItems.length) * 100}%` }}
              />
            </div>

            {onboardingItems.map(item => {
              const isChecked = selectedChecklist[item.key as OnboardingItemKey]
              return (
                <button
                  key={item.key}
                  onClick={() => handleToggleItem(selectedChecklist.id, item.key, isChecked)}
                  disabled={updating === item.key}
                  className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-colors ${
                    isChecked
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-border hover:bg-muted/50'
                  }`}
                >
                  {updating === item.key ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : isChecked ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="text-lg mr-2">{item.icon}</span>
                  <span className={`text-sm font-medium ${isChecked ? 'text-green-700' : 'text-foreground'}`}>
                    {item.label}
                  </span>
                </button>
              )
            })}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── List View ──

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserPlus className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Onboarding</h2>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Crear Checklist
          </Button>
        )}
      </div>

      {/* Stats (admin only) */}
      {isAdmin && checklists.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total</span>
              </div>
              <p className="text-2xl font-bold mt-1">{checklists.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Completados</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-green-600">{completedCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-muted-foreground">Pendientes</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-yellow-600">{pendingCount}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Checklists */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : checklists.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay checklists de onboarding</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {checklists.map(checklist => {
            const completed = getCompletedCount(checklist)
            const total = onboardingItems.length
            const pct = Math.round((completed / total) * 100)

            return (
              <Card
                key={checklist.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedChecklist(checklist)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{checklist.user_name}</h3>
                        {checklist.user_unit && (
                          <Badge variant="outline">Apto {checklist.user_unit}</Badge>
                        )}
                        <Badge className={checklist.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {checklist.status === 'completed' ? 'Completado' : 'En Progreso'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{completed}/{total}</span>
                      </div>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Checklist de Onboarding</DialogTitle>
            <DialogDescription>Asigne un checklist de bienvenida a un nuevo residente</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">ID del usuario *</label>
              <Input
                value={createForm.user_id}
                onChange={e => setCreateForm(prev => ({ ...prev, user_id: e.target.value }))}
                placeholder="UUID del residente"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Nombre *</label>
              <Input
                value={createForm.user_name}
                onChange={e => setCreateForm(prev => ({ ...prev, user_name: e.target.value }))}
                placeholder="Nombre del residente"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Unidad</label>
              <Input
                value={createForm.user_unit}
                onChange={e => setCreateForm(prev => ({ ...prev, user_unit: e.target.value }))}
                placeholder="Ej: 301"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating || !createForm.user_id || !createForm.user_name}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


