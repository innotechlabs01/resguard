import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getDatabaseProvider } from '@/lib/env'

let supabase: SupabaseClient | null = null

/**
 * Cliente Supabase con anon key (servidor). Para RLS con usuario final,
 * usar sesión JWT del usuario cuando esté cableado.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (getDatabaseProvider() !== 'supabase') return null
  const url = process.env.DATABASE_URL_SUPABASE
  const key =
    process.env.DATABASE_SERVICES_SUPABASE ?? process.env.DATABASE_PWD_SUPABASE
  if (!url || !key) return null

  if (!supabase) {
    supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return supabase
}
