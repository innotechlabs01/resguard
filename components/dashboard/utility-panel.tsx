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
  Droplets,
  Flame,
  Zap,
  Plus,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'

const serviceConfig: Record<string, { label: string; icon: typeof Droplets; color: string; unit: string }> = {
  water: { label: 'Agua', icon: Droplets, color: 'text-blue-600', unit: 'm3' },
  gas: { label: 'Gas', icon: Flame, color: 'text-orange-600', unit: 'm3' },
  electricity: { label: 'Energia', icon: Zap, color: 'text-yellow-600', unit: 'kWh' },
}

interface Reading {
  id: string
  building_id: string
  unit_number: string
  service_type: string
  reading_date: string
  previous_reading: number | null
  current_reading: number | null
  consumption: number | null
  rate_per_unit: number | null
  total_charge: number | null
  notes: string | null
  created_at: string
}

interface Alert {
  unit_number: string
  service_type: string
  consumption: number
  average: number
  ratio: number
}

export function UtilityPanel({ buildingId }: { buildingId: string }) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  const [readings, setReadings] = useState<Reading[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [activeService, setActiveService] = useState<string>('water')
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    unit_number: '',
    service_type: 'water',
    reading_date: new Date().toISOString().split('T')[0],
    previous_reading: '',
    current_reading: '',
    rate_per_unit: '',
    notes: '',
  })

  const fetchReadings = useCallback(async () => {
    try {
      const params = new URLSearchParams({ buildingId })
      if (activeService) params.set('serviceType', activeService)
      if (selectedUnit) params.set('unitNumber', selectedUnit)

      const res = await fetch(`/api/utility?${params}`)
      if (res.ok) {
        const data = await res.json()
        setReadings(data.readings || [])
      }
    } catch (err) {
      console.error('Error fetching readings:', err)
    } finally {
      setLoading(false)
    }
  }, [buildingId, activeService, selectedUnit])

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch(`/api/utility/alerts?buildingId=${buildingId}`)
      if (res.ok) {
        const data = await res.json()
        setAlerts(data.alerts || [])
      }
    } catch (err) {
      console.error('Error fetching alerts:', err)
    }
  }, [buildingId])

  useEffect(() => { fetchReadings() }, [fetchReadings])
  useEffect(() => { fetchAlerts() }, [fetchAlerts])

  const handleCreate = async () => {
    if (!createForm.unit_number || !createForm.previous_reading || !createForm.current_reading || !createForm.rate_per_unit) return
    setCreating(true)
    try {
      const res = await fetch('/api/utility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          building_id: buildingId,
          unit_number: createForm.unit_number,
          service_type: createForm.service_type,
          reading_date: createForm.reading_date,
          previous_reading: parseFloat(createForm.previous_reading),
          current_reading: parseFloat(createForm.current_reading),
          rate_per_unit: parseFloat(createForm.rate_per_unit),
          notes: createForm.notes || undefined,
        }),
      })
      if (res.ok) {
        setCreateDialogOpen(false)
        setCreateForm({
          unit_number: '',
          service_type: 'water',
          reading_date: new Date().toISOString().split('T')[0],
          previous_reading: '',
          current_reading: '',
          rate_per_unit: '',
          notes: '',
        })
        fetchReadings()
        fetchAlerts()
      }
    } catch (err) {
      console.error('Error creating reading:', err)
    } finally {
      setCreating(false)
    }
  }

  // Group readings by unit
  const unitGroups: Record<string, Reading[]> = {}
  for (const r of readings) {
    if (!unitGroups[r.unit_number]) unitGroups[r.unit_number] = []
    unitGroups[r.unit_number].push(r)
  }

  const cfg = serviceConfig[activeService]
  const Icon = cfg.icon

  // Service summary cards
  const serviceSummary = Object.entries(serviceConfig).map(([key, sCfg]) => {
    const serviceReadings = readings.filter(r => r.service_type === key)
    const totalConsumption = serviceReadings.reduce((sum, r) => sum + (r.consumption ? Number(r.consumption) : 0), 0)
    const totalCharge = serviceReadings.reduce((sum, r) => sum + (r.total_charge ? Number(r.total_charge) : 0), 0)
    const unitCount = new Set(serviceReadings.map(r => r.unit_number)).size
    return { key, ...sCfg, totalConsumption, totalCharge, unitCount }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-6 w-6 ${cfg.color}`} />
          <h2 className="text-2xl font-bold text-foreground">Consumo de Servicios</h2>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Registrar Lectura
          </Button>
        )}
      </div>

      {/* Service summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {serviceSummary.map(s => {
          const SIcon = s.icon
          return (
            <Card
              key={s.key}
              className={`cursor-pointer transition-colors ${activeService === s.key ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
              onClick={() => setActiveService(s.key)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SIcon className={`h-5 w-5 ${s.color}`} />
                    <span className="font-medium">{s.label}</span>
                  </div>
                  <Badge variant="secondary">{s.unitCount} unidades</Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Consumo Total</p>
                    <p className="text-lg font-bold">{s.totalConsumption.toFixed(1)} {s.unit}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cargo Total</p>
                    <p className="text-lg font-bold">${s.totalCharge.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              Alertas de Consumo Anomalo ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-red-700">
                    Unidad {alert.unit_number} - {serviceConfig[alert.service_type]?.label || alert.service_type}
                  </span>
                  <span className="font-medium text-red-800">
                    {alert.consumption.toFixed(1)} ({alert.ratio}x promedio)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unit filter */}
      <div className="flex items-center gap-3">
        <Select value={selectedUnit || 'all'} onValueChange={v => setSelectedUnit(v === 'all' ? null : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por unidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las unidades</SelectItem>
            {Object.keys(unitGroups).sort().map(unit => (
              <SelectItem key={unit} value={unit}>Unidad {unit}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Readings table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : readings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Icon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay lecturas registradas</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Lecturas Recientes - {cfg.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Unidad</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Fecha</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Lectura Ant.</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Lectura Actual</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Consumo</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Tarifa</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Cargo</th>
                  </tr>
                </thead>
                <tbody>
                  {readings.map(r => {
                    const isAlert = alerts.some(a => a.unit_number === r.unit_number && a.service_type === r.service_type)
                    return (
                      <tr key={r.id} className={`border-b border-border/50 ${isAlert ? 'bg-red-50' : ''}`}>
                        <td className="py-2 px-3 font-medium">{r.unit_number}</td>
                        <td className="py-2 px-3 text-muted-foreground">
                          {new Date(r.reading_date).toLocaleDateString('es-CO')}
                        </td>
                        <td className="py-2 px-3 text-right">{r.previous_reading?.toFixed(1) ?? '-'}</td>
                        <td className="py-2 px-3 text-right font-medium">{r.current_reading?.toFixed(1) ?? '-'}</td>
                        <td className="py-2 px-3 text-right">
                          <span className={isAlert ? 'text-red-600 font-semibold' : ''}>
                            {r.consumption?.toFixed(1) ?? '-'} {cfg.unit}
                          </span>
                          {isAlert && <AlertTriangle className="inline h-3 w-3 text-red-500 ml-1" />}
                        </td>
                        <td className="py-2 px-3 text-right">${r.rate_per_unit?.toFixed(2) ?? '-'}</td>
                        <td className="py-2 px-3 text-right font-medium">
                          ${r.total_charge?.toLocaleString() ?? '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Lectura</DialogTitle>
            <DialogDescription>Registra una nueva lectura de medidor</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Unidad *</label>
                <Input
                  value={createForm.unit_number}
                  onChange={e => setCreateForm(prev => ({ ...prev, unit_number: e.target.value }))}
                  placeholder="Ej: 301"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Servicio *</label>
                <Select
                  value={createForm.service_type}
                  onValueChange={v => setCreateForm(prev => ({ ...prev, service_type: v }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(serviceConfig).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Fecha de Lectura *</label>
              <Input
                type="date"
                value={createForm.reading_date}
                onChange={e => setCreateForm(prev => ({ ...prev, reading_date: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Lectura Anterior *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={createForm.previous_reading}
                  onChange={e => setCreateForm(prev => ({ ...prev, previous_reading: e.target.value }))}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Lectura Actual *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={createForm.current_reading}
                  onChange={e => setCreateForm(prev => ({ ...prev, current_reading: e.target.value }))}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Tarifa por Unidad *</label>
              <Input
                type="number"
                step="0.0001"
                value={createForm.rate_per_unit}
                onChange={e => setCreateForm(prev => ({ ...prev, rate_per_unit: e.target.value }))}
                placeholder="0.0000"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Notas</label>
              <Textarea
                value={createForm.notes}
                onChange={e => setCreateForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Observaciones adicionales..."
                rows={2}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !createForm.unit_number || !createForm.previous_reading || !createForm.current_reading || !createForm.rate_per_unit}
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
