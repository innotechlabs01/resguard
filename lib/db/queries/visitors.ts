import 'server-only'
import { queryMany, queryOne, executeInsert } from './helpers'
import type { InValue } from '@libsql/client'

export interface DbVisitor {
  id: string
  building_id: string
  name: string
  document_id: string
  type: string
  vehicle_plate: string | null
  destination_unit: string | null
  resident_name: string | null
  entry_time: string
  exit_time: string | null
  parking_spot: string | null
  status: string
}

export async function getVisitorById(id: string): Promise<DbVisitor | null> {
  return queryOne<DbVisitor>(
    'SELECT * FROM visitors WHERE id = ?',
    [id],
    async (client) => {
      const { data, error } = await client!.from('visitors').select('*').eq('id', id).single()
      return { data: data as DbVisitor | null, error }
    }
  )
}

export async function getVisitors(buildingId: string): Promise<DbVisitor[]> {
  return queryMany<DbVisitor>(
    'SELECT * FROM visitors WHERE building_id = ? ORDER BY entry_time DESC',
    [buildingId],
    async (client) => {
      const { data, error } = await client!.from('visitors').select('*').eq('building_id', buildingId).order('entry_time', { ascending: false })
      return { data: data as DbVisitor[] | null, error }
    }
  )
}

export async function createVisitor(visitor: Omit<DbVisitor, 'id'> & { id?: string }): Promise<void> {
  const id = visitor.id ?? crypto.randomUUID()
  await executeInsert(
    'INSERT INTO visitors (id, building_id, name, document_id, type, vehicle_plate, destination_unit, resident_name, entry_time, exit_time, parking_spot, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, visitor.building_id, visitor.name, visitor.document_id, visitor.type, visitor.vehicle_plate, visitor.destination_unit, visitor.resident_name, visitor.entry_time, visitor.exit_time, visitor.parking_spot, visitor.status] as InValue[],
    async (client) => {
      const { error } = await client!.from('visitors').insert({
        id,
        building_id: visitor.building_id,
        name: visitor.name,
        document_id: visitor.document_id,
        type: visitor.type,
        vehicle_plate: visitor.vehicle_plate,
        destination_unit: visitor.destination_unit,
        resident_name: visitor.resident_name,
        entry_time: visitor.entry_time,
        exit_time: visitor.exit_time,
        parking_spot: visitor.parking_spot,
        status: visitor.status,
      })
      return { error }
    }
  )
}

export async function updateVisitor(id: string, updates: Partial<DbVisitor>): Promise<void> {
  const fields: string[] = []
  const values: InValue[] = []
  if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status) }
  if (updates.exit_time !== undefined) { fields.push('exit_time = ?'); values.push(updates.exit_time) }
  if (updates.parking_spot !== undefined) { fields.push('parking_spot = ?'); values.push(updates.parking_spot) }
  if (fields.length === 0) return
  values.push(id)
  await executeInsert(
    `UPDATE visitors SET ${fields.join(', ')} WHERE id = ?`,
    values,
    async (client) => {
      const supabaseUpdates: Record<string, unknown> = {}
      if (updates.status !== undefined) supabaseUpdates.status = updates.status
      if (updates.exit_time !== undefined) supabaseUpdates.exit_time = updates.exit_time
      if (updates.parking_spot !== undefined) supabaseUpdates.parking_spot = updates.parking_spot
      const { error } = await client!.from('visitors').update(supabaseUpdates).eq('id', id)
      return { error }
    }
  )
}

export async function deleteVisitor(id: string): Promise<void> {
  await executeInsert(
    'DELETE FROM visitors WHERE id = ?',
    [id],
    async (client) => {
      const { error } = await client!.from('visitors').delete().eq('id', id)
      return { error }
    }
  )
}
