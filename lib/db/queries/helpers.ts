import 'server-only'
import { getTursoClient } from '@/lib/db/turso'
import type { InValue } from '@libsql/client'

export async function queryMany<T>(
  sql: string,
  args: InValue[]
): Promise<T[]> {
  const client = getTursoClient()
  if (!client) throw new Error('Turso client not available')
  const result = await client.execute({ sql, args })
  return result.rows as T[]
}

export async function queryOne<T>(
  sql: string,
  args: InValue[]
): Promise<T | null> {
  const client = getTursoClient()
  if (!client) throw new Error('Turso client not available')
  const result = await client.execute({ sql, args })
  return (result.rows[0] as T) ?? null
}

export async function executeInsert(
  sql: string,
  args: InValue[]
): Promise<void> {
  const client = getTursoClient()
  if (!client) throw new Error('Turso client not available')
  await client.execute({ sql, args })
}
