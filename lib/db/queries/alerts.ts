import 'server-only'
import { queryMany, queryOne, executeInsert } from './helpers'
import type { InValue } from '@libsql/client'

export interface DbAlert {
  id: string
  building_id: string
  type: string
  title: string
  message: string
  timestamp: string
  read: number | boolean
  priority: string
  related_id: string | null
  action_required: number | boolean | null
}

export async function getAlertById(id: string): Promise<DbAlert | null> {
  return queryOne<DbAlert>(
    'SELECT * FROM alerts WHERE id = ?',
    [id],
    async (client) => {
      const { data, error } = await client!.from('alerts').select('*').eq('id', id).single()
      return { data: data as DbAlert | null, error }
    }
  )
}

export async function getAlerts(buildingId?: string): Promise<DbAlert[]> {
  if (buildingId) {
    return queryMany<DbAlert>(
      'SELECT * FROM alerts WHERE building_id = ? ORDER BY timestamp DESC',
      [buildingId],
      async (client) => {
        const { data, error } = await client!.from('alerts').select('*').eq('building_id', buildingId).order('timestamp', { ascending: false })
        return { data: data as DbAlert[] | null, error }
      }
    )
  }
  return queryMany<DbAlert>(
    'SELECT * FROM alerts ORDER BY timestamp DESC',
    [],
    async (client) => {
      const { data, error } = await client!.from('alerts').select('*').order('timestamp', { ascending: false })
      return { data: data as DbAlert[] | null, error }
    }
  )
}

export async function createAlert(alert: Omit<DbAlert, 'id' | 'timestamp'> & { id?: string }): Promise<void> {
  const id = alert.id ?? crypto.randomUUID()
  await executeInsert(
    'INSERT INTO alerts (id, building_id, type, title, message, read, priority, related_id, action_required) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, alert.building_id, alert.type, alert.title, alert.message, alert.read ? 1 : 0, alert.priority, alert.related_id, alert.action_required ? 1 : 0] as InValue[],
    async (client) => {
      const { error } = await client!.from('alerts').insert({
        id,
        building_id: alert.building_id,
        type: alert.type,
        title: alert.title,
        message: alert.message,
        read: alert.read,
        priority: alert.priority,
        related_id: alert.related_id,
        action_required: alert.action_required,
      })
      return { error }
    }
  )
}

export async function updateAlert(id: string, updates: Partial<DbAlert>): Promise<void> {
  const fields: string[] = []
  const values: InValue[] = []
  if (updates.read !== undefined) { fields.push('read = ?'); values.push(updates.read ? 1 : 0) }
  if (updates.priority !== undefined) { fields.push('priority = ?'); values.push(updates.priority) }
  if (updates.message !== undefined) { fields.push('message = ?'); values.push(updates.message) }
  if (fields.length === 0) return
  values.push(id)
  await executeInsert(
    `UPDATE alerts SET ${fields.join(', ')} WHERE id = ?`,
    values,
    async (client) => {
      const supabaseUpdates: Record<string, unknown> = {}
      if (updates.read !== undefined) supabaseUpdates.read = updates.read
      if (updates.priority !== undefined) supabaseUpdates.priority = updates.priority
      if (updates.message !== undefined) supabaseUpdates.message = updates.message
      const { error } = await client!.from('alerts').update(supabaseUpdates).eq('id', id)
      return { error }
    }
  )
}

export async function deleteAlert(id: string): Promise<void> {
  await executeInsert(
    'DELETE FROM alerts WHERE id = ?',
    [id],
    async (client) => {
      const { error } = await client!.from('alerts').delete().eq('id', id)
      return { error }
    }
  )
}
