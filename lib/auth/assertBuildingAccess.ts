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
