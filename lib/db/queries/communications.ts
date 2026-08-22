import 'server-only'
import { queryMany, queryOne, executeInsert } from './helpers'
import type { InValue } from './helpers'

export interface DbCommunication {
  id: string
  building_id: string
  author_id: string
  author_name: string
  title: string
  message: string
  type: string
  priority: string
  sent_at: string
}

export async function getCommunicationById(id: string): Promise<DbCommunication | null> {
  return queryOne<DbCommunication>(
    'SELECT * FROM communications WHERE id = ?',
    [id]
  )
}

export async function getCommunications(buildingId: string): Promise<DbCommunication[]> {
  return queryMany<DbCommunication>(
    'SELECT * FROM communications WHERE building_id = ? ORDER BY sent_at DESC',
    [buildingId]
  )
}

export async function createCommunication(comm: Omit<DbCommunication, 'id' | 'sent_at'> & { id?: string }): Promise<void> {
  const id = comm.id ?? crypto.randomUUID()
  await executeInsert(
    'INSERT INTO communications (id, building_id, author_id, author_name, title, message, type, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, comm.building_id, comm.author_id, comm.author_name, comm.title, comm.message, comm.type, comm.priority] as InValue[]
  )
}

export async function updateCommunication(id: string, updates: Partial<DbCommunication>): Promise<void> {
  const fields: string[] = []
  const values: InValue[] = []
  if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title) }
  if (updates.message !== undefined) { fields.push('message = ?'); values.push(updates.message) }
  if (updates.priority !== undefined) { fields.push('priority = ?'); values.push(updates.priority) }
  if (fields.length === 0) return
  values.push(id)
  await executeInsert(
    `UPDATE communications SET ${fields.join(', ')} WHERE id = ?`,
    values
  )
}

export async function deleteCommunication(id: string): Promise<void> {
  await executeInsert(
    'DELETE FROM communications WHERE id = ?',
    [id]
  )
}
