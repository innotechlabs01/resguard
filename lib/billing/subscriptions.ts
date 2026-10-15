import 'server-only'

import { getSupabaseAdmin } from '@/lib/db/supabase'
import {
  buildSubscriptionReference,
  createSubscriptionPaymentLink,
} from '@/lib/bold-client'

// ---------------------------------------------------------------------------
// Tipos (alineados 1:1 con supabase/migrations/030_plans_subscriptions.sql)
// ---------------------------------------------------------------------------

export type BillingInterval = 'monthly' | 'yearly'

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled'

export interface Plan {
  id: string
  code: string
  name: string
  description: string | null
  price_cop: number
  billing_interval: BillingInterval
  max_units: number | null
  features: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  building_id: string
  plan_id: string
  status: SubscriptionStatus
  current_period_start: string | null
  current_period_end: string | null
  canceled_at: string | null
  created_at: string
  updated_at: string
}

export interface SubscriptionWithPlan extends Subscription {
  plan: Plan
}

export type SubscriptionEventType =
  | 'checkout_created'
  | 'activated'
  | 'renewed'
  | 'past_due'
  | 'canceled'

export interface SubscriptionEvent {
  id: string
  subscription_id: string
  event_type: string
  payload: Record<string, unknown>
  created_at: string
}

export class BillingError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'not_configured'
      | 'plan_not_found'
      | 'subscription_not_found'
      | 'invalid_state'
      | 'db_error'
  ) {
    super(message)
    this.name = 'BillingError'
  }
}

function adminOrThrow() {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    throw new BillingError('Supabase service client no configurado', 'not_configured')
  }
  return supabase
}

const PLAN_COLUMNS =
  'id, code, name, description, price_cop, billing_interval, max_units, features, is_active, created_at, updated_at'

// ---------------------------------------------------------------------------
// Plans (catálogo)
// ---------------------------------------------------------------------------

/** Lista los planes activos del catálogo, ordenados por precio ascendente. */
export async function listActivePlans(): Promise<Plan[]> {
  const supabase = adminOrThrow()
  const { data, error } = await supabase
    .from('plans')
    .select(PLAN_COLUMNS)
    .eq('is_active', true)
    .order('price_cop', { ascending: true })

  if (error) throw new BillingError(`Error listando planes: ${error.message}`, 'db_error')
  return (data ?? []) as Plan[]
}

/** Busca un plan activo por su código (`basic`, `pro`, `premium`, ...). */
export async function getPlanByCode(code: string): Promise<Plan | null> {
  const supabase = adminOrThrow()
  const { data, error } = await supabase
    .from('plans')
    .select(PLAN_COLUMNS)
    .eq('code', code)
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw new BillingError(`Error consultando plan: ${error.message}`, 'db_error')
  return (data as Plan | null) ?? null
}

// ---------------------------------------------------------------------------
// Subscriptions (consulta)
// ---------------------------------------------------------------------------

/** Suscripción más reciente de un edificio (cualquier estado), con su plan. */
export async function getSubscriptionForBuilding(
  buildingId: string
): Promise<SubscriptionWithPlan | null> {
  const supabase = adminOrThrow()
  const { data, error } = await supabase
    .from('subscriptions')
    .select(`*, plan:plans(${PLAN_COLUMNS})`)
    .eq('building_id', buildingId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new BillingError(`Error consultando suscripción: ${error.message}`, 'db_error')
  return (data as SubscriptionWithPlan | null) ?? null
}

/** Suscripción activa del edificio (hay como máximo una, por índice parcial). */
export async function getActiveSubscriptionForBuilding(
  buildingId: string
): Promise<SubscriptionWithPlan | null> {
  const supabase = adminOrThrow()
  const { data, error } = await supabase
    .from('subscriptions')
    .select(`*, plan:plans(${PLAN_COLUMNS})`)
    .eq('building_id', buildingId)
    .eq('status', 'active')
    .maybeSingle()

  if (error) throw new BillingError(`Error consultando suscripción activa: ${error.message}`, 'db_error')
  return (data as SubscriptionWithPlan | null) ?? null
}

export async function getSubscriptionById(id: string): Promise<SubscriptionWithPlan | null> {
  const supabase = adminOrThrow()
  const { data, error } = await supabase
    .from('subscriptions')
    .select(`*, plan:plans(${PLAN_COLUMNS})`)
    .eq('id', id)
    .maybeSingle()

  if (error) throw new BillingError(`Error consultando suscripción: ${error.message}`, 'db_error')
  return (data as SubscriptionWithPlan | null) ?? null
}

// ---------------------------------------------------------------------------
// Checkout (Bold link por ciclo — ver plan T-024, decisión 2)
// ---------------------------------------------------------------------------

export interface CreateSubscriptionCheckoutParams {
  buildingId: string
  planCode: string
  payerEmail?: string
}

export interface CreateSubscriptionCheckoutResult {
  subscription: Subscription
  checkoutUrl: string
  boldLinkId: string
  reference: string
}

/**
 * Crea una suscripción nueva en estado `trial` (placeholder pre-pago: la
 * activación ocurre SOLO vía webhook firmado) y el payment link de Bold para
 * el primer ciclo. La referencia del link es `subscription:<id>:<period>`,
 * que el webhook usa para enrutar el pago (ver parseSubscriptionReference).
 *
 * La trazabilidad del `bold_link_id` queda en `subscription_events`
 * (event_type `checkout_created`) porque la tabla no tiene columna propia.
 */
export async function createSubscriptionCheckout(
  params: CreateSubscriptionCheckoutParams
): Promise<CreateSubscriptionCheckoutResult> {
  const { buildingId, planCode, payerEmail } = params

  const plan = await getPlanByCode(planCode)
  if (!plan) {
    throw new BillingError(`Plan no encontrado o inactivo: ${planCode}`, 'plan_not_found')
  }

  const supabase = adminOrThrow()

  const { data: subscription, error: insertError } = await supabase
    .from('subscriptions')
    .insert({
      building_id: buildingId,
      plan_id: plan.id,
      status: 'trial',
    })
    .select()
    .single()

  if (insertError || !subscription) {
    throw new BillingError(
      `Error creando suscripción: ${insertError?.message ?? 'sin datos'}`,
      'db_error'
    )
  }

  const period = 1
  const { boldLinkId, url, reference } = await createSubscriptionPaymentLink({
    subscriptionId: subscription.id,
    period,
    planName: plan.name,
    amountCOP: plan.price_cop,
    payerEmail,
  })

  await recordSubscriptionEvent(subscription.id, 'checkout_created', {
    bold_link_id: boldLinkId,
    checkout_url: url,
    reference,
    period,
    plan_code: plan.code,
    amount_cop: plan.price_cop,
  })

  return {
    subscription: subscription as Subscription,
    checkoutUrl: url,
    boldLinkId,
    reference,
  }
}

// ---------------------------------------------------------------------------
// Ciclo de vida (invocado por el webhook de Bold / administración)
// ---------------------------------------------------------------------------

function addInterval(from: Date, interval: BillingInterval): Date {
  const end = new Date(from)
  if (interval === 'yearly') {
    end.setFullYear(end.getFullYear() + 1)
  } else {
    end.setMonth(end.getMonth() + 1)
  }
  return end
}

/**
 * Activa la suscripción tras un pago confirmado (webhook PAID). Cancela
 * primero cualquier otra suscripción activa del edificio para respetar el
 * índice parcial único (1 activa por edificio). Idempotente: si ya está
 * activa con el mismo período en curso, es no-op y devuelve la suscripción.
 */
export async function activateSubscription(
  subscriptionId: string,
  options?: { actor?: string }
): Promise<Subscription> {
  const supabase = adminOrThrow()

  const current = await getSubscriptionById(subscriptionId)
  if (!current) {
    throw new BillingError(`Suscripción no encontrada: ${subscriptionId}`, 'subscription_not_found')
  }

  if (current.status === 'active') {
    return current
  }
  if (current.status === 'canceled') {
    throw new BillingError(
      'No se puede activar una suscripción cancelada; crear un checkout nuevo',
      'invalid_state'
    )
  }

  const now = new Date()
  const periodEnd = addInterval(now, current.plan.billing_interval)

  // Exclusividad: cancelar otras activas del mismo edificio antes de activar.
  const { data: otherActive } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('building_id', current.building_id)
    .eq('status', 'active')
    .neq('id', subscriptionId)

  if (otherActive && otherActive.length > 0) {
    const nowIso = now.toISOString()
    const { error: cancelOthersError } = await supabase
      .from('subscriptions')
      .update({ status: 'canceled', canceled_at: nowIso, updated_at: nowIso })
      .in('id', otherActive.map((s) => s.id))

    if (cancelOthersError) {
      throw new BillingError(
        `Error cancelando suscripciones previas: ${cancelOthersError.message}`,
        'db_error'
      )
    }
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', subscriptionId)
    .neq('status', 'active') // guard de concurrencia: otro proceso ya activó → 0 filas
    .select()
    .maybeSingle()

  if (error) throw new BillingError(`Error activando suscripción: ${error.message}`, 'db_error')
  if (!data) {
    // Otro proceso activó concurrentemente (guard `.neq('status','active')`).
    const refreshed = await getSubscriptionById(subscriptionId)
    return refreshed ?? current
  }

  await recordSubscriptionEvent(subscriptionId, 'activated', {
    actor: options?.actor ?? 'bold_webhook',
    plan_code: current.plan.code,
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
  })

  return data as Subscription
}

/** Extiende el período vigente en un ciclo (renovación por pago confirmado). */
export async function renewSubscription(subscriptionId: string): Promise<Subscription> {
  const supabase = adminOrThrow()

  const current = await getSubscriptionById(subscriptionId)
  if (!current) {
    throw new BillingError(`Suscripción no encontrada: ${subscriptionId}`, 'subscription_not_found')
  }
  if (current.status !== 'active' && current.status !== 'past_due') {
    throw new BillingError(
      `No se puede renovar una suscripción en estado ${current.status}`,
      'invalid_state'
    )
  }

  const now = new Date()
  const base = current.current_period_end && new Date(current.current_period_end) > now
    ? new Date(current.current_period_end)
    : now
  const periodEnd = addInterval(base, current.plan.billing_interval)

  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_start: base.toISOString(),
      current_period_end: periodEnd.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', subscriptionId)
    .select()
    .single()

  if (error || !data) {
    throw new BillingError(`Error renovando suscripción: ${error?.message ?? 'sin datos'}`, 'db_error')
  }

  await recordSubscriptionEvent(subscriptionId, 'renewed', {
    current_period_start: base.toISOString(),
    current_period_end: periodEnd.toISOString(),
  })

  return data as Subscription
}

/** Marca la suscripción como `past_due` (pago fallido o vencida sin renovar). */
export async function markSubscriptionPastDue(subscriptionId: string): Promise<Subscription> {
  return transitionStatus(subscriptionId, 'past_due', { allowFrom: ['active'] })
}

/** Cancela la suscripción (mantiene el período ya pago hasta su fin). */
export async function cancelSubscription(subscriptionId: string): Promise<Subscription> {
  return transitionStatus(subscriptionId, 'canceled', {
    allowFrom: ['trial', 'active', 'past_due'],
  })
}

async function transitionStatus(
  subscriptionId: string,
  target: 'past_due' | 'canceled',
  options: { allowFrom: SubscriptionStatus[] }
): Promise<Subscription> {
  const supabase = adminOrThrow()

  const current = await getSubscriptionById(subscriptionId)
  if (!current) {
    throw new BillingError(`Suscripción no encontrada: ${subscriptionId}`, 'subscription_not_found')
  }
  if (!options.allowFrom.includes(current.status)) {
    throw new BillingError(
      `Transición inválida: ${current.status} → ${target}`,
      'invalid_state'
    )
  }

  const now = new Date().toISOString()
  const update: Record<string, unknown> = { status: target, updated_at: now }
  if (target === 'canceled') update.canceled_at = now

  const { data, error } = await supabase
    .from('subscriptions')
    .update(update)
    .eq('id', subscriptionId)
    .select()
    .single()

  if (error || !data) {
    throw new BillingError(`Error actualizando suscripción: ${error?.message ?? 'sin datos'}`, 'db_error')
  }

  await recordSubscriptionEvent(subscriptionId, target, { from: current.status })

  return data as Subscription
}

// ---------------------------------------------------------------------------
// Events (audit log)
// ---------------------------------------------------------------------------

/**
 * Registra un evento de ciclo de vida. Nunca rompe el flujo principal:
 * un fallo de auditoría se loguea y se degrada a no-op.
 */
export async function recordSubscriptionEvent(
  subscriptionId: string,
  eventType: SubscriptionEventType,
  payload: Record<string, unknown> = {}
): Promise<void> {
  try {
    const supabase = adminOrThrow()
    const { error } = await supabase
      .from('subscription_events')
      .insert({ subscription_id: subscriptionId, event_type: eventType, payload })

    if (error) {
      console.error('[billing] error insertando subscription_event:', error.message)
    }
  } catch (err) {
    console.error('[billing] error insertando subscription_event:', err)
  }
}

export { buildSubscriptionReference }
