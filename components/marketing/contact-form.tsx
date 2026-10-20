'use client'

import { useState } from 'react'
import { Loader2, CheckCircle2, AlertCircle, Building2, Users, Phone, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ContactFormProps {
  planInterest?: 'basico' | 'profesional' | 'corporativo' | 'no_se'
  compact?: boolean
}

/**
 * Sales lead capture form for the landing page.
 * Submits to /api/sales-leads (public, rate limited 3/h per IP).
 * The super_admin receives the lead and the sales team contacts the prospect.
 */
export function ContactForm({ planInterest = 'no_se', compact = false }: ContactFormProps) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    building_count: 1,
    unit_count: '',
    message: '',
  })
  const [selectedPlan, setSelectedPlan] = useState<string>(planInterest)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/sales-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          company_name: form.company_name || undefined,
          building_count: Number(form.building_count) || 1,
          unit_count: form.unit_count ? Number(form.unit_count) : undefined,
          message: form.message || undefined,
          plan_interest: selectedPlan,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error || 'No se pudo enviar. Intenta de nuevo.')
        return
      }

      setSuccess(true)
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-success/20 bg-success/5 p-8 text-center space-y-3">
        <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
        <h3 className="text-lg font-semibold text-foreground">¡Gracias, {form.name.split(' ')[0]}!</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Recibimos tu solicitud. Te contactaremos en menos de 24 horas para agendar
          una demo de ResGuard adaptada a tus edificios.
        </p>
        <p className="text-xs text-muted-foreground">
          Revisa tu correo — te llegará la confirmación.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${compact ? '' : 'max-w-lg mx-auto'}`}>
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg flex items-center gap-2" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="lead-name">Nombre completo *</Label>
          <Input
            id="lead-name"
            placeholder="Ej: Juan Rodríguez"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lead-email">Correo electrónico *</Label>
          <Input
            id="lead-email"
            type="email"
            placeholder="juan@empresa.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="lead-phone">Teléfono / WhatsApp</Label>
          <Input
            id="lead-phone"
            type="tel"
            placeholder="+57 300 000 0000"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lead-company">Empresa / Administración</Label>
          <Input
            id="lead-company"
            placeholder="Ej: Admin Copropiedades SAS"
            value={form.company_name}
            onChange={(e) => setForm({ ...form, company_name: e.target.value })}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="lead-buildings" className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            ¿Cuántos edificios administras?
          </Label>
          <Select
            value={String(form.building_count)}
            onValueChange={(v) => setForm({ ...form, building_count: Number(v) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 edificio</SelectItem>
              <SelectItem value="2">2-5 edificios</SelectItem>
              <SelectItem value="6">6-10 edificios</SelectItem>
              <SelectItem value="11">11-24 edificios</SelectItem>
              <SelectItem value="25">25+ edificios</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="lead-units" className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Unidades / apartamentos (aprox)
          </Label>
          <Input
            id="lead-units"
            type="number"
            placeholder="Ej: 240"
            min={0}
            value={form.unit_count}
            onChange={(e) => setForm({ ...form, unit_count: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>¿Qué plan te interesa?</Label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'basico', label: 'Básico', desc: '1 edificio' },
            { id: 'profesional', label: 'Profesional', desc: '2-5 edificios' },
            { id: 'corporativo', label: 'Corporativo', desc: '6+ edificios' },
          ].map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelectedPlan(plan.id)}
              className={`rounded-lg border p-3 text-center transition-colors ${
                selectedPlan === plan.id
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <p className="text-sm font-medium">{plan.label}</p>
              <p className="text-xs">{plan.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="lead-message">¿Qué necesitas resolver? (opcional)</Label>
        <Textarea
          id="lead-message"
          placeholder="Ej: Necesitamos controlar visitantes de 3 torres, enviar comunicados y manejar parqueaderos..."
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          rows={3}
        />
      </div>

      <Button type="submit" disabled={saving} className="w-full gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {saving ? 'Enviando…' : 'Hablemos — Quiero una demo'}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        🔒 Tus datos están seguros. Solo los usamos para contactarte sobre ResGuard.
      </p>
    </form>
  )
}
