'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Loader2,
  Receipt,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'

interface SubscriptionInfo {
  id: string
  status: string
  plan_name: string
  plan_code: string
  price_cop: number
  billing_interval: string
  current_period_start: string
  current_period_end: string
  grace_period_end: string | null
  features: Record<string, boolean>
}

interface BillingPanelProps {
  organizationId: string
  organizationName: string
}

const formatCOP = (amount: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount)

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))

const daysUntil = (date: string) => {
  const diff = new Date(date).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

/**
 * Billing panel for the organization titular.
 * Shows subscription status, period, grace period, and pay/renew action.
 * Blocked subscriptions still show this panel + the pay button (recovery flow).
 */
export function BillingPanel({ organizationId, organizationName }: BillingPanelProps) {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscription = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/subscriptions/current?organization_id=${encodeURIComponent(organizationId)}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'No se pudo cargar la suscripción.')
        return
      }
      setSubscription(data.subscription || null)
    } catch {
      setError('Error de conexión.')
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  const handlePay = async () => {
    if (!subscription) return
    setCheckoutLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planCode: subscription.plan_code,
          organizationId: organizationId,
          payerEmail: user?.email,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'No se pudo iniciar el pago.')
        return
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    } catch {
      setError('Error de conexión con el procesador de pagos.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  // No subscription yet
  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Suscripción de {organizationName}
          </CardTitle>
          <CardDescription>No tienes una suscripción activa.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Contrata un plan para acceder a todas las funciones de ResGuard para tu organización.
          </p>
          <Button onClick={() => (window.location.href = '/#planes')} className="gap-2">
            Ver planes <ArrowUpRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    )
  }

  const isBlocked = subscription.status === 'blocked'
  const isGrace = subscription.status === 'past_due' && subscription.grace_period_end
  const isActive = subscription.status === 'active'
  const daysLeft = subscription.current_period_end
    ? daysUntil(subscription.current_period_end)
    : 0
  const graceDaysLeft = subscription.grace_period_end
    ? daysUntil(subscription.grace_period_end)
    : 0

  return (
    <div className="space-y-4">
      {/* Status card */}
      <Card className={isBlocked ? 'border-destructive/30' : isActive ? 'border-success/30' : 'border-warning/30'}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Suscripción
            </span>
            {isActive && (
              <Badge className="bg-success/10 text-success border-success/20 gap-1">
                <CheckCircle2 className="h-3 w-3" /> Activa
              </Badge>
            )}
            {isGrace && (
              <Badge className="bg-warning/10 text-warning border-warning/20 gap-1">
                <Clock className="h-3 w-3" /> En gracia ({graceDaysLeft}d)
              </Badge>
            )}
            {isBlocked && (
              <Badge className="bg-destructive/10 text-destructive border-destructive/20 gap-1">
                <XCircle className="h-3 w-3" /> Bloqueada
              </Badge>
            )}
            {subscription.status === 'canceled' && (
              <Badge variant="outline">Cancelada</Badge>
            )}
          </CardTitle>
          <CardDescription>Plan {subscription.plan_name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Precio</p>
              <p className="text-lg font-semibold text-foreground">
                {formatCOP(subscription.price_cop)}
                <span className="text-sm font-normal text-muted-foreground">
                  /{subscription.billing_interval === 'monthly' ? 'mes' : 'periodo'}
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Período actual</p>
              <p className="text-sm font-medium text-foreground">
                {subscription.current_period_start
                  ? formatDate(subscription.current_period_start)
                  : '—'}
                {' → '}
                {subscription.current_period_end
                  ? formatDate(subscription.current_period_end)
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {isGrace ? 'Gracia termina en' : isActive ? 'Días restantes' : 'Estado'}
              </p>
              <p className="text-sm font-medium text-foreground">
                {isGrace
                  ? `${graceDaysLeft} día(s)`
                  : isActive
                    ? `${daysLeft} día(s)`
                    : 'Vencida'}
              </p>
            </div>
          </div>

          {isBlocked && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Suscripción bloqueada por mora</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tu período terminó y los 5 días de gracia expiraron sin pago confirmado.
                    Paga ahora para restaurar el acceso completo. Tus datos están intactos
                    y se restaurarán inmediatamente después del pago.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isGrace && (
            <div className="rounded-lg bg-warning/10 border border-warning/20 p-4">
              <div className="flex items-start gap-2">
                <Clock className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Período de gracia activo</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tu suscripción venció. Tienes {graceDaysLeft} día(s) de gracia para pagar
                    sin perder acceso. Después del quinto día, las funciones se bloquearán.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pay button — always available (recovery flow) */}
          <Button
            onClick={handlePay}
            disabled={checkoutLoading}
            className="w-full gap-2"
            variant={isBlocked ? 'default' : 'outline'}
          >
            {checkoutLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            {isBlocked
              ? 'Pagar ahora y restaurar acceso'
              : isGrace
                ? 'Pagar ahora (dentro de gracia)'
                : 'Renovar suscripción'}
          </Button>

          {error && (
            <p className="text-sm text-destructive" role="alert">{error}</p>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>
              Pago procesado por Bold. No almacenamos datos de tu tarjeta.
              Cancela cuando quieras sin penalidades.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
