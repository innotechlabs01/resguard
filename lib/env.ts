/**
 * Resolución de entorno y proveedor de base de datos (solo servidor salvo NEXT_PUBLIC_*).
 * - Local / QA: suele usarse Turso (variables en .env.development, cargado por Next en `next dev`).
 * - Productivo: Supabase (variables en .env.productive vía scripts o panel del host).
 */

export type AppEnv = 'development' | 'qa' | 'production'

export type DatabaseProvider = 'turso' | 'supabase' | 'none'

export function getAppEnv(): AppEnv {
  const explicit =
    process.env.APP_ENV || process.env.NEXT_PUBLIC_APP_ENV || process.env.VERCEL_ENV
  if (explicit === 'qa' || explicit === 'preview') return 'qa'
  if (explicit === 'production' || process.env.NODE_ENV === 'production') return 'production'
  return 'development'
}

export function getDatabaseProvider(): DatabaseProvider {
  const env = getAppEnv()
  if (env === 'production') {
    if (process.env.DATABASE_URL_SUPABASE) return 'supabase'
    return 'none'
  }
  if (process.env.DATABASE_URL_TURSO) return 'turso'
  return 'none'
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
