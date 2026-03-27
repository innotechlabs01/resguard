import 'server-only'
import { queryOne, executeInsert } from './helpers'
import type { InValue } from '@libsql/client'

export interface DbSystemStats {
  id: string
  total_buildings: number
  active_buildings: number
  total_residents: number
  total_revenue: number
  monthly_recurring_revenue: number
  pending_payments: number
  system_alerts: number
  updated_at: string
}

export async function getSystemStatsById(id: string): Promise<DbSystemStats | null> {
  return queryOne<DbSystemStats>(
    'SELECT * FROM system_stats WHERE id = ?',
    [id],
    async (client) => {
      const { data, error } = await client!.from('system_stats').select('*').eq('id', id).single()
      return { data: data as DbSystemStats | null, error }
    }
  )
}

export async function getSystemStats(): Promise<DbSystemStats | null> {
  return queryOne<DbSystemStats>(
    'SELECT * FROM system_stats ORDER BY updated_at DESC LIMIT 1',
    [],
    async (client) => {
      const { data, error } = await client!.from('system_stats').select('*').order('updated_at', { ascending: false }).limit(1).single()
      return { data: data as DbSystemStats | null, error }
    }
  )
}

export async function createSystemStats(stats: Omit<DbSystemStats, 'id' | 'updated_at'> & { id?: string }): Promise<void> {
  const id = stats.id ?? crypto.randomUUID()
  await executeInsert(
    'INSERT INTO system_stats (id, total_buildings, active_buildings, total_residents, total_revenue, monthly_recurring_revenue, pending_payments, system_alerts) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, stats.total_buildings, stats.active_buildings, stats.total_residents, stats.total_revenue, stats.monthly_recurring_revenue, stats.pending_payments, stats.system_alerts] as InValue[],
    async (client) => {
      const { error } = await client!.from('system_stats').insert({
        id,
        total_buildings: stats.total_buildings,
        active_buildings: stats.active_buildings,
        total_residents: stats.total_residents,
        total_revenue: stats.total_revenue,
        monthly_recurring_revenue: stats.monthly_recurring_revenue,
        pending_payments: stats.pending_payments,
        system_alerts: stats.system_alerts,
      })
      return { error }
    }
  )
}

export async function updateSystemStats(id: string, updates: Partial<DbSystemStats>): Promise<void> {
  const fields: string[] = []
  const values: InValue[] = []
  if (updates.total_buildings !== undefined) { fields.push('total_buildings = ?'); values.push(updates.total_buildings) }
  if (updates.active_buildings !== undefined) { fields.push('active_buildings = ?'); values.push(updates.active_buildings) }
  if (updates.total_residents !== undefined) { fields.push('total_residents = ?'); values.push(updates.total_residents) }
  if (updates.total_revenue !== undefined) { fields.push('total_revenue = ?'); values.push(updates.total_revenue) }
  if (updates.monthly_recurring_revenue !== undefined) { fields.push('monthly_recurring_revenue = ?'); values.push(updates.monthly_recurring_revenue) }
  if (updates.pending_payments !== undefined) { fields.push('pending_payments = ?'); values.push(updates.pending_payments) }
  if (updates.system_alerts !== undefined) { fields.push('system_alerts = ?'); values.push(updates.system_alerts) }
  if (fields.length === 0) return
  values.push(id)
  await executeInsert(
    `UPDATE system_stats SET ${fields.join(', ')} WHERE id = ?`,
    values,
    async (client) => {
      const supabaseUpdates: Record<string, unknown> = {}
      if (updates.total_buildings !== undefined) supabaseUpdates.total_buildings = updates.total_buildings
      if (updates.active_buildings !== undefined) supabaseUpdates.active_buildings = updates.active_buildings
      if (updates.total_residents !== undefined) supabaseUpdates.total_residents = updates.total_residents
      if (updates.total_revenue !== undefined) supabaseUpdates.total_revenue = updates.total_revenue
      if (updates.monthly_recurring_revenue !== undefined) supabaseUpdates.monthly_recurring_revenue = updates.monthly_recurring_revenue
      if (updates.pending_payments !== undefined) supabaseUpdates.pending_payments = updates.pending_payments
      if (updates.system_alerts !== undefined) supabaseUpdates.system_alerts = updates.system_alerts
      const { error } = await client!.from('system_stats').update(supabaseUpdates).eq('id', id)
      return { error }
    }
  )
}

export async function deleteSystemStats(id: string): Promise<void> {
  await executeInsert(
    'DELETE FROM system_stats WHERE id = ?',
    [id],
    async (client) => {
      const { error } = await client!.from('system_stats').delete().eq('id', id)
      return { error }
    }
  )
}
