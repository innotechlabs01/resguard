import 'server-only'
import { queryOne, executeInsert } from './helpers'

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
    [id]
  )
}

export async function getSystemStats(): Promise<DbSystemStats | null> {
  return queryOne<DbSystemStats>(
    'SELECT * FROM system_stats ORDER BY updated_at DESC LIMIT 1',
    []
  )
}

export async function createSystemStats(stats: {
  total_buildings: number
  active_buildings: number
  total_residents: number
  total_revenue: number
  monthly_recurring_revenue: number
  pending_payments: number
  system_alerts: number
}): Promise<void> {
  const id = crypto.randomUUID()
  await executeInsert(
    'INSERT INTO system_stats (id, total_buildings, active_buildings, total_residents, total_revenue, monthly_recurring_revenue, pending_payments, system_alerts, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, stats.total_buildings, stats.active_buildings, stats.total_residents, stats.total_revenue, stats.monthly_recurring_revenue, stats.pending_payments, stats.system_alerts, new Date().toISOString()]
  )
}

export async function updateSystemStats(id: string, updates: Partial<DbSystemStats>): Promise<void> {
  const fields: string[] = []
  const values: (string | number | null)[] = []
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
    values
  )
}

export async function deleteSystemStats(id: string): Promise<void> {
  await executeInsert(
    'DELETE FROM system_stats WHERE id = ?',
    [id]
  )
}
