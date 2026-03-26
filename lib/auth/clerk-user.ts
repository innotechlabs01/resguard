import type { User, UserRole } from '@/lib/types'
import { mockUsers } from '@/lib/mock-data'

function isUserRole(x: unknown): x is UserRole {
  return (
    x === 'super_admin' ||
    x === 'admin' ||
    x === 'vigilante' ||
    x === 'usuario'
  )
}

/**
 * Mapea un usuario de Clerk al modelo `User` de la app.
 * Prioridad: metadata pública de Clerk → coincidencia por email con usuarios demo → residente genérico.
 */
export function userFromClerkLike(input: {
  id: string
  fullName: string | null
  primaryEmail: string | null
  publicMetadata: Record<string, unknown>
}): User {
  const meta = input.publicMetadata
  const roleFromMeta = meta.role
  const buildingFromMeta = meta.buildingId

  const byEmail = input.primaryEmail
    ? mockUsers.find(
        (u) => u.email.toLowerCase() === input.primaryEmail!.toLowerCase()
      )
    : undefined

  const role: UserRole = isUserRole(roleFromMeta)
    ? roleFromMeta
    : byEmail?.role ?? 'usuario'

  const buildingId =
    typeof buildingFromMeta === 'string'
      ? buildingFromMeta
      : byEmail?.buildingId

  return {
    id: input.id,
    name:
      input.fullName ||
      byEmail?.name ||
      input.primaryEmail?.split('@')[0] ||
      'Usuario',
    email: input.primaryEmail || byEmail?.email || '',
    role,
    buildingId,
    avatar: undefined,
  }
}
