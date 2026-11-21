import 'server-only'

import type { DbUser } from '@/lib/db/queries/users'
import { getSupabaseAdmin } from '@/lib/db/supabase'

/**
 * Returns all organization IDs an admin owns or is an active titular/admin member of.
 */
export async function getAdminOrganizationIds(user: DbUser): Promise<string[]> {
  const orgIds = new Set<string>()
  if (user.organization_id) {
    orgIds.add(user.organization_id)
  }

  const admin = getSupabaseAdmin()
  if (!admin) return Array.from(orgIds)

  try {
    const [{ data: owned }, { data: memberships }] = await Promise.all([
      admin.from('organizations').select('id').eq('owner_user_id', user.id),
      admin
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .in('role', ['titular', 'admin']),
    ])

    for (const row of owned || []) {
      if (row.id) orgIds.add(row.id)
    }
    for (const row of memberships || []) {
      if (row.organization_id) orgIds.add(row.organization_id)
    }
  } catch {
    // Fallback to user.organization_id if query builder is unavailable
  }

  return Array.from(orgIds)
}

/**
 * Multi-tenant building access check:
 * - super_admin: access to all buildings
 * - admin: access to their building_id OR any building in their organizations
 * - vigilante / usuario: access only to their assigned building_id
 */
export async function assertBuildingAccessAsync(
  user: DbUser,
  requestedBuildingId?: string | null
) {
  if (!requestedBuildingId) {
    return { ok: false as const, status: 400 as const, error: 'buildingId required' }
  }
  if (user.role === 'super_admin') {
    return { ok: true as const }
  }
  if (user.building_id === requestedBuildingId) {
    return { ok: true as const }
  }
  if (user.role === 'admin') {
    const orgIds = await getAdminOrganizationIds(user)
    if (orgIds.length > 0) {
      const admin = getSupabaseAdmin()
      if (admin) {
        const { data: building } = await admin
          .from('buildings')
          .select('id, organization_id')
          .eq('id', requestedBuildingId)
          .single()
        if (building?.organization_id && orgIds.includes(building.organization_id)) {
          return { ok: true as const }
        }
      }
    }
  }
  return { ok: false as const, status: 403 as const, error: 'Forbidden: building mismatch' }
}

export function assertBuildingAccess(user: DbUser, requestedBuildingId?: string | null) {
  if (!requestedBuildingId) {
    return { ok: false as const, status: 400 as const, error: 'buildingId required' }
  }
  if (user.role === 'super_admin') {
    return { ok: true as const }
  }
  if (user.building_id !== requestedBuildingId) {
    return { ok: false as const, status: 403 as const, error: 'Forbidden: building mismatch' }
  }
  return { ok: true as const }
}

/**
 * Verifies that a resource fetched by ID belongs to the caller's building.
 * Returns null if access is OK, or an error object for the route to return.
 */
export function assertResourceBuilding(
  user: DbUser,
  resourceBuildingId: string | null | undefined
): { ok: true } | { ok: false; status: 403; error: string } {
  if (user.role === 'super_admin') return { ok: true }
  if (!resourceBuildingId || resourceBuildingId !== user.building_id) {
    return {
      ok: false,
      status: 403,
      error: 'Forbidden: resource not in your building',
    }
  }
  return { ok: true }
}

/**
 * Async multi-tenant version of assertResourceBuilding.
 * Delegates to assertBuildingAccessAsync so admins can access resources
 * belonging to any building in their organization.
 */
export async function assertResourceBuildingAsync(
  user: DbUser,
  resourceBuildingId: string | null | undefined
): Promise<{ ok: true } | { ok: false; status: 403; error: string }> {
  if (user.role === 'super_admin') return { ok: true }
  if (!resourceBuildingId) {
    return {
      ok: false,
      status: 403,
      error: 'Forbidden: resource not in your building',
    }
  }
  const access = await assertBuildingAccessAsync(user, resourceBuildingId)
  if (access.ok) return { ok: true }
  return {
    ok: false,
    status: 403,
    error: 'Forbidden: resource not in your building',
  }
}
