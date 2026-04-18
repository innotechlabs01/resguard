import 'server-only'
import { queryMany, queryOne, executeInsert } from './helpers'

export interface DbAlert {
  id: string
  building_id: string
  type: string
  title: string
  message: string
  created_at: string
  read: number
  priority: string
  related_id: string | null
  action_required: number
}

export async function getAlertById(id: string): Promise<DbAlert | null> {
  return queryOne<DbAlert>(
    'SELECT * FROM alerts WHERE id = ?',
    [id]
  )
}

export async function getAlerts(buildingId?: string): Promise<DbAlert[]> {
  if (buildingId) {
    return queryMany<DbAlert>(
      'SELECT * FROM alerts WHERE building_id = ? ORDER BY created_at DESC',
      [buildingId]
    )
  }
  return queryMany<DbAlert>(
    'SELECT * FROM alerts ORDER BY created_at DESC',
    []
  )
}

export async function createAlert(alert: {
  building_id: string
  type: string
  title: string
  message: string
  priority?: string
  read?: boolean
  action_required?: boolean
  related_id?: string | null
}): Promise<void> {
  const id = crypto.randomUUID()
  await executeInsert(
    'INSERT INTO alerts (id, building_id, type, title, message, read, priority, related_id, action_required, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      id, 
      alert.building_id, 
      alert.type, 
      alert.title, 
      alert.message, 
      alert.read ? 1 : 0, 
      alert.priority || 'medium', 
      alert.related_id || null, 
      alert.action_required ? 1 : 0,
      new Date().toISOString(),
    ]
  )
}

export async function updateAlert(id: string, updates: Partial<DbAlert>): Promise<void> {
  const fields: string[] = []
  const values: (string | number | null)[] = []
  if (updates.read !== undefined) { fields.push('read = ?'); values.push(updates.read) }
  if (updates.priority !== undefined) { fields.push('priority = ?'); values.push(updates.priority) }
  if (updates.message !== undefined) { fields.push('message = ?'); values.push(updates.message) }
  if (fields.length === 0) return
  values.push(id)
  await executeInsert(
    `UPDATE alerts SET ${fields.join(', ')} WHERE id = ?`,
    values
  )
}

export async function deleteAlert(id: string): Promise<void> {
  await executeInsert(
    'DELETE FROM alerts WHERE id = ?',
    [id]
  )
}
