import 'server-only'

import type { DbUser } from '@/lib/db/queries/users'

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
