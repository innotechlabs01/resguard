import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let supabase: SupabaseClient | null = null

/**
 * Supabase admin client (service_role). Requires DATABASE_URL_SUPABASE + DATABASE_SERVICES_SUPABASE.
 * Legacy alias DATABASE_PWD_SUPABASE kept as fallback.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.DATABASE_URL_SUPABASE
  const key = process.env.DATABASE_SERVICES_SUPABASE ?? process.env.DATABASE_PWD_SUPABASE
  if (!url || !key) return null
  if (!supabase) {
    supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return supabase
}
