import 'server-only'
import { getSupabaseAdmin } from '@/lib/db/supabase'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'plan-limits' })

interface PlanLimits {
  maxBuildings: number
  maxAdminUsers: number
  maxUnits: number
}

interface LimitCheckResult {
  allowed: boolean
  limit?: number
  current: number
  resource: string
  message?: string
}

/**
 * Gets the active plan limits for an organization.
 */
export async function getPlanLimits(organizationId: string): Promise<PlanLimits | null> {
  const admin = getSupabaseAdmin()
  if (!admin) return null

  const { data, error } = await admin
    .from('subscriptions')
    .select('plan_id, plans(max_buildings, max_admin_users, max_units)')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null

  const plan = (data as { plans?: { max_buildings?: number; max_admin_users?: number; max_units?: number } }).plans
  if (!plan) return null

  return {
    maxBuildings: plan.max_buildings ?? 1,
    maxAdminUsers: plan.max_admin_users ?? 3,
    maxUnits: plan.max_units ?? 100,
  }
}

/**
 * Counts current buildings in an organization.
 */
export async function countOrgBuildings(organizationId: string): Promise<number> {
  const admin = getSupabaseAdmin()
  if (!admin) return 0

  const { count, error } = await admin
    .from('buildings')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)

  if (error) {
    log.error({ error, organizationId }, 'Failed to count org buildings')
    return 0
  }

  return count || 0
}

/**
 * Counts current admin-level members in an organization.
 */
export async function countOrgAdminUsers(organizationId: string): Promise<number> {
  const admin = getSupabaseAdmin()
  if (!admin) return 0

  const { count, error } = await admin
    .from('organization_members')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('role', 'admin')
    .eq('status', 'active')

  if (error) {
    log.error({ error, organizationId }, 'Failed to count org admin users')
    return 0
  }

  return count || 0
}

/**
 * Checks if the organization can add another building.
 * Returns null if allowed, or a Response (403) with limit info.
 */
export async function checkBuildingLimit(
  organizationId: string | null | undefined
): Promise<Response | null> {
  if (!organizationId) return null // No org = no limit (legacy mode)

  const limits = await getPlanLimits(organizationId)
  if (!limits) return null // No plan found = no limit

  const current = await countOrgBuildings(organizationId)

  if (current >= limits.maxBuildings) {
    return Response.json(
      {
        error: 'plan_limit_reached',
        resource: 'buildings',
        limit: limits.maxBuildings,
        current,
        message: `Tu plan permite hasta ${limits.maxBuildings} edificio(s). Ya tienes ${current}. Contacta a ResGuard para actualizar tu plan.`,
      },
      { status: 403 }
    )
  }

  return null
}

/**
 * Checks if the organization can add another admin user.
 * Returns null if allowed, or a Response (403) with limit info.
 */
export async function checkAdminUserLimit(
  organizationId: string | null | undefined
): Promise<Response | null> {
  if (!organizationId) return null

  const limits = await getPlanLimits(organizationId)
  if (!limits) return null

  const current = await countOrgAdminUsers(organizationId)

  if (current >= limits.maxAdminUsers) {
    return Response.json(
      {
        error: 'plan_limit_reached',
        resource: 'admin_users',
        limit: limits.maxAdminUsers,
        current,
        message: `Tu plan permite hasta ${limits.maxAdminUsers} administrador(es). Ya tienes ${current}.`,
      },
      { status: 403 }
    )
  }

  return null
}
