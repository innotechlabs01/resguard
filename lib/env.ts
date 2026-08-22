/**
 * Resolución de entorno y proveedor de base de datos (solo servidor salvo NEXT_PUBLIC_*).
 * - Productivo: Supabase (PostgreSQL) — único proveedor.
 */

export type AppEnv = 'development' | 'qa' | 'production'

export type DatabaseProvider = 'supabase' | 'none'

export function getAppEnv(): AppEnv {
  const explicit =
    process.env.APP_ENV || process.env.NEXT_PUBLIC_APP_ENV || process.env.VERCEL_ENV
  if (explicit === 'qa' || explicit === 'preview') return 'qa'
  if (explicit === 'production' || process.env.NODE_ENV === 'production') return 'production'
  return 'development'
}

export function getDatabaseProvider(): DatabaseProvider {
  if (process.env.DATABASE_URL_SUPABASE || process.env.DATABASE_SERVICES_SUPABASE || process.env.DATABASE_PWD_SUPABASE) return 'supabase'
  return 'none'
}

export function isSupabaseConfigured(): boolean {
  return getDatabaseProvider() === 'supabase'
}

export function hasClerkPublicKey(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim().length)
}

/** Clerk completo (middleware / servidor): requiere clave secreta. */
export function isClerkFullyConfigured(): boolean {
  return (
    hasClerkPublicKey() &&
    Boolean(process.env.CLERK_SECRET_KEY?.trim().length)
  )
}
