import 'server-only'
import { getDatabaseProvider } from '@/lib/env'
import { getTursoClient } from '@/lib/db/turso'
import { getSupabaseAdmin } from '@/lib/db/supabase'
import type { InValue } from '@libsql/client'

export async function queryMany<T>(
  tursoSql: string,
  tursoArgs: InValue[],
  supabaseQuery: (client: ReturnType<typeof getSupabaseAdmin>) => Promise<{ data: T[] | null; error: any }>
): Promise<T[]> {
  const provider = getDatabaseProvider()

  if (provider === 'turso') {
    const client = getTursoClient()
    if (!client) return []
    const result = await client.execute({ sql: tursoSql, args: tursoArgs })
    return result.rows as T[]
  }

  if (provider === 'supabase') {
    const client = getSupabaseAdmin()
    if (!client) return []
    const { data, error } = await supabaseQuery(client)
    if (error) throw error
    return data ?? []
  }

  return []
}

export async function queryOne<T>(
  tursoSql: string,
  tursoArgs: InValue[],
  supabaseQuery: (client: ReturnType<typeof getSupabaseAdmin>) => Promise<{ data: T | null; error: any }>
): Promise<T | null> {
  const provider = getDatabaseProvider()

  if (provider === 'turso') {
    const client = getTursoClient()
    if (!client) return null
    const result = await client.execute({ sql: tursoSql, args: tursoArgs })
    return (result.rows[0] as T) ?? null
  }

  if (provider === 'supabase') {
    const client = getSupabaseAdmin()
    if (!client) return null
    const { data, error } = await supabaseQuery(client)
    if (error) throw error
    return data ?? null
  }

  return null
}

export async function executeInsert(
  tursoSql: string,
  tursoArgs: InValue[],
  supabaseInsert: (client: ReturnType<typeof getSupabaseAdmin>) => Promise<{ error: any }>
): Promise<void> {
  const provider = getDatabaseProvider()

  if (provider === 'turso') {
    const client = getTursoClient()
    if (!client) throw new Error('Turso client not available')
    await client.execute({ sql: tursoSql, args: tursoArgs })
    return
  }

  if (provider === 'supabase') {
    const client = getSupabaseAdmin()
    if (!client) throw new Error('Supabase client not available')
    const { error } = await supabaseInsert(client)
    if (error) throw error
    return
  }
}
