import 'server-only'
import { queryMany, queryOne, executeInsert } from './helpers'

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
    [id]
  )
}

export async function getVisitors(buildingId: string): Promise<DbVisitor[]> {
  return queryMany<DbVisitor>(
    'SELECT * FROM visitors WHERE building_id = ? ORDER BY entry_time DESC',
    [buildingId]
  )
}

export async function createVisitor(visitor: {
  building_id: string
  name: string
  document_id: string
  type: string
  vehicle_plate?: string | null
  destination_unit?: string | null
  resident_name?: string | null
  entry_time: string
  parking_spot?: string | null
  status: string
}): Promise<void> {
  const id = crypto.randomUUID()
  await executeInsert(
    'INSERT INTO visitors (id, building_id, name, document_id, type, vehicle_plate, destination_unit, resident_name, entry_time, exit_time, parking_spot, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      id, 
      visitor.building_id, 
      visitor.name, 
      visitor.document_id, 
      visitor.type, 
      visitor.vehicle_plate || null, 
      visitor.destination_unit || null, 
      visitor.resident_name || null, 
      visitor.entry_time, 
      null, 
      visitor.parking_spot || null, 
      visitor.status,
    ]
  )
}

export async function updateVisitor(id: string, updates: Partial<DbVisitor>): Promise<void> {
  const fields: string[] = []
  const values: (string | null)[] = []
  if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status) }
  if (updates.exit_time !== undefined) { fields.push('exit_time = ?'); values.push(updates.exit_time) }
  if (updates.parking_spot !== undefined) { fields.push('parking_spot = ?'); values.push(updates.parking_spot) }
  if (fields.length === 0) return
  values.push(id)
  await executeInsert(
    `UPDATE visitors SET ${fields.join(', ')} WHERE id = ?`,
    values
  )
}

export async function deleteVisitor(id: string): Promise<void> {
  await executeInsert(
    'DELETE FROM visitors WHERE id = ?',
    [id]
  )
}
