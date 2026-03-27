import 'server-only'
import { queryMany, queryOne, executeInsert } from './helpers'
import type { InValue } from '@libsql/client'

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
    [id],
    async (client) => {
      const { data, error } = await client!.from('communications').select('*').eq('id', id).single()
      return { data: data as DbCommunication | null, error }
    }
  )
}

export async function getCommunications(buildingId: string): Promise<DbCommunication[]> {
  return queryMany<DbCommunication>(
    'SELECT * FROM communications WHERE building_id = ? ORDER BY sent_at DESC',
    [buildingId],
    async (client) => {
      const { data, error } = await client!.from('communications').select('*').eq('building_id', buildingId).order('sent_at', { ascending: false })
      return { data: data as DbCommunication[] | null, error }
    }
  )
}

export async function createCommunication(comm: Omit<DbCommunication, 'id' | 'sent_at'> & { id?: string }): Promise<void> {
  const id = comm.id ?? crypto.randomUUID()
  await executeInsert(
    'INSERT INTO communications (id, building_id, author_id, author_name, title, message, type, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, comm.building_id, comm.author_id, comm.author_name, comm.title, comm.message, comm.type, comm.priority] as InValue[],
    async (client) => {
      const { error } = await client!.from('communications').insert({
        id,
        building_id: comm.building_id,
        author_id: comm.author_id,
        author_name: comm.author_name,
        title: comm.title,
        message: comm.message,
        type: comm.type,
        priority: comm.priority,
      })
      return { error }
    }
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
    values,
    async (client) => {
      const supabaseUpdates: Record<string, unknown> = {}
      if (updates.title !== undefined) supabaseUpdates.title = updates.title
      if (updates.message !== undefined) supabaseUpdates.message = updates.message
      if (updates.priority !== undefined) supabaseUpdates.priority = updates.priority
      const { error } = await client!.from('communications').update(supabaseUpdates).eq('id', id)
      return { error }
    }
  )
}

export async function deleteCommunication(id: string): Promise<void> {
  await executeInsert(
    'DELETE FROM communications WHERE id = ?',
    [id],
    async (client) => {
      const { error } = await client!.from('communications').delete().eq('id', id)
      return { error }
    }
  )
}
