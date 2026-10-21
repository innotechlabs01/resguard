import 'server-only'
import { getSupabaseAdmin } from '@/lib/db/supabase'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'subscription-guard' })

export type SubscriptionStatus = 'active' | 'grace_period' | 'blocked' | 'none'

interface SubscriptionInfo {
  status: SubscriptionStatus
  planName?: string
  periodEnd?: string
  graceEnd?: string
}

/**
 * Gets the effective subscription status for an organization (or building for legacy).
 * Uses the DB function get_org_subscription_status for source-of-truth logic.
 */
export async function getSubscriptionStatus(organizationId: string): Promise<SubscriptionInfo> {
  const admin = getSupabaseAdmin()
  if (!admin) return { status: 'none' }

  const { data, error } = await admin
    .rpc('get_org_subscription_status', { org_id: organizationId })

  if (error) {
    log.error({ error, organizationId }, 'Failed to get subscription status')
    return { status: 'none' }
  }

  const status = (data as SubscriptionStatus) || 'none'

  // Fetch details for the response
  const { data: sub } = await admin
    .from('subscriptions')
    .select('current_period_end, grace_period_end, plan_id, plans(name)')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return {
    status,
    planName: (sub as { plans?: { name?: string } })?.plans?.name,
    periodEnd: (sub as { current_period_end?: string })?.current_period_end || undefined,
    graceEnd: (sub as { grace_period_end?: string })?.grace_period_end || undefined,
  }
}

/**
 * Subscription guard: returns null if access is allowed,
 * or a Response object (402/403) if blocked by subscription status.
 *
 * Usage in API routes:
 *   const guard = await checkSubscriptionAccess(organizationId)
 *   if (guard) return guard  // returns 402 response
 */
export async function checkSubscriptionAccess(
  organizationId: string | null | undefined
): Promise<Response | null> {
  if (!organizationId) {
    // No organization = legacy mode or no org created yet; allow access
    return null
  }

  const { status, periodEnd, graceEnd } = await getSubscriptionStatus(organizationId)

  switch (status) {
    case 'active':
    case 'none': // No subscription = free/trial mode; allow
      return null

    case 'grace_period': {
      // Grace period: still allowed, but we log it for monitoring
      log.warn({ organizationId, graceEnd }, 'Organization in grace period')
      return null
    }

    case 'blocked': {
      return Response.json(
        {
          error: 'subscription_blocked',
          message: 'Tu suscripción ha vencido. Paga para restaurar el acceso completo.',
          periodEnd,
        },
        { status: 402 }
      )
    }

    default:
      return null
  }
}

/**
 * Legacy: checks subscription for a building (pre-organization model).
 */
export async function checkBuildingSubscriptionAccess(
  buildingId: string | null | undefined
): Promise<Response | null> {
  if (!buildingId) return null

  const admin = getSupabaseAdmin()
  if (!admin) return null

  const { data: building } = await admin
    .from('buildings')
    .select('organization_id, subscription_status')
    .eq('id', buildingId)
    .single()

  if (!building) return null

  // If building has an organization, use org-level check
  if (building.organization_id) {
    return checkSubscriptionAccess(building.organization_id)
  }

  // Legacy building-level check (no organization)
  // Allow access — building-level subscriptions are managed by super_admin
  return null
}
