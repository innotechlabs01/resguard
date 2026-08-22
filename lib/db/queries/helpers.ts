import 'server-only'
import { getSupabaseAdmin } from '@/lib/db/supabase'

export type InValue = string | number | null | boolean

function getClient() {
  const c = getSupabaseAdmin()
  if (!c) throw new Error('Supabase client not configured: set DATABASE_URL_SUPABASE and DATABASE_SERVICES_SUPABASE')
  return c
}

function parseTable(sql: string): string {
  const m = sql.match(/FROM\s+(\w+)|INTO\s+(\w+)|UPDATE\s+(\w+)/i)
  if (!m) throw new Error(`Cannot parse table from SQL: ${sql}`)
  return (m[1] || m[2] || m[3]).toLowerCase()
}

export async function queryMany<T>(sql: string, args: InValue[]): Promise<T[]> {
  const client = getClient()
  const table = parseTable(sql)
  const upper = sql.toUpperCase()

  // COUNT(*) query
  if (upper.includes('COUNT(*)')) {
    const whereMatch = sql.match(/WHERE\s+(.+)/i)
    let q = client.from(table).select('*', { count: 'exact', head: false })
    // Simple two-condition support: col1 = ? AND col2 = ?
    if (whereMatch) {
      const conds = whereMatch[1].split(/\s+AND\s+/i)
      conds.forEach((c, i) => {
        const col = c.split('=')[0]?.trim().replace(/["`]/g, '')
        if (col && args[i] !== undefined) q = q.eq(col, args[i] as string)
      })
    }
    const { data, error, count } = await q
    if (error) throw error
    if (upper.includes('AS COUNT')) return [{ count: count ?? data?.length ?? 0 } as unknown as T]
    return (data as T[]) ?? []
  }

  // Standard SELECT
  let query: ReturnType<typeof client.from> extends never ? never : ReturnType<typeof client.from> = client.from(table).select('*') as never
  let q: any = client.from(table).select('*')

  // WHERE building_id = ? or id = ? etc.
  const whereIdx = upper.indexOf('WHERE')
  if (whereIdx !== -1) {
    let whereClause = sql.slice(whereIdx + 5)
    // Strip ORDER BY / LIMIT
    whereClause = whereClause.split(/ORDER BY/i)[0].split(/LIMIT/i)[0]
    const conds = whereClause.split(/\s+AND\s+/i)
    conds.forEach((c, i) => {
      const col = c.split('=')[0]?.trim().replace(/["`?]/g, '').replace(/\s+/g, '')
      // Handle LIMIT ? as param — skip
      if (col?.toLowerCase() === 'limit' || !col) return
      if (args[i] !== undefined) q = q.eq(col, args[i] as string)
    })
  }

  if (upper.includes('ORDER BY')) {
    const orderMatch = sql.match(/ORDER BY\s+(\w+)(\s+DESC|\s+ASC)?/i)
    if (orderMatch) {
      const col = orderMatch[1]
      const desc = /DESC/i.test(orderMatch[2] || '')
      q = q.order(col, { ascending: !desc })
    }
  }

  if (upper.includes('LIMIT')) {
    const lim = args[args.length - 1]
    if (typeof lim === 'number') q = q.limit(lim)
    else {
      const m = sql.match(/LIMIT\s+(\d+)/i)
      if (m) q = q.limit(parseInt(m[1], 10))
    }
  }

  const { data, error } = await q
  if (error) throw error
  return (data as T[]) ?? []
}

export async function queryOne<T>(sql: string, args: InValue[]): Promise<T | null> {
  const rows = await queryMany<T>(sql, args)
  return rows[0] ?? null
}

export async function executeInsert(sql: string, args: InValue[]): Promise<void> {
  const client = getClient()
  const upper = sql.trim().toUpperCase()

  if (upper.startsWith('INSERT')) {
    const table = parseTable(sql)
    const colsMatch = sql.match(/\(([^)]+)\)\s*VALUES/i)
    if (!colsMatch) throw new Error(`Cannot parse INSERT cols: ${sql}`)
    const cols = colsMatch[1].split(',').map(c => c.trim().replace(/["`]/g, ''))
    const row: Record<string, InValue> = {}
    cols.forEach((col, i) => { row[col] = args[i] ?? null })
    const { error } = await client.from(table).insert(row as never)
    if (error) throw error
    return
  }

  if (upper.startsWith('UPDATE')) {
    const table = parseTable(sql)
    const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/i)
    const whereMatch = sql.match(/WHERE\s+(.+)/i)
    if (!setMatch || !whereMatch) throw new Error(`Cannot parse UPDATE: ${sql}`)
    const setParts = setMatch[1].split(',').map(s => s.trim())
    const updates: Record<string, InValue> = {}
    setParts.forEach((p, i) => {
      const col = p.split('=')[0].trim().replace(/["`]/g, '')
      updates[col] = args[i] ?? null
    })
    const whereCol = whereMatch[1].split('=')[0].trim().replace(/["`]/g, '')
    const whereVal = args[setParts.length]
    const { error } = await (client.from(table) as any).update(updates).eq(whereCol, whereVal as string)
    if (error) throw error
    return
  }

  if (upper.startsWith('DELETE')) {
    const table = parseTable(sql)
    const whereMatch = sql.match(/WHERE\s+(\w+)\s*=\s*\?/i)
    if (!whereMatch) throw new Error(`Cannot parse DELETE: ${sql}`)
    const col = whereMatch[1]
    const { error } = await (client.from(table) as any).delete().eq(col, args[0] as string)
    if (error) throw error
    return
  }

  throw new Error(`Unsupported SQL in executeInsert: ${sql}`)
}
