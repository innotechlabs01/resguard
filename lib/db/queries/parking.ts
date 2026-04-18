import 'server-only'
import { queryMany, queryOne, executeInsert } from './helpers'
import type { InValue } from '@libsql/client'

export interface DbParkingSpot {
  id: string
  building_id: string
  code: string
  status: string
  vehicle_plate: string | null
  visitor_name: string | null
  resident_unit: string | null
  entry_time: string | null
  max_duration: number
}

export async function getParkingSpotById(id: string): Promise<DbParkingSpot | null> {
  return queryOne<DbParkingSpot>(
    'SELECT * FROM parking_spots WHERE id = ?',
    [id]
  )
}

export async function getParkingSpots(buildingId: string): Promise<DbParkingSpot[]> {
  return queryMany<DbParkingSpot>(
    'SELECT * FROM parking_spots WHERE building_id = ? ORDER BY code',
    [buildingId]
  )
}

export async function createParkingSpot(spot: Omit<DbParkingSpot, 'id'> & { id?: string }): Promise<void> {
  const id = spot.id ?? crypto.randomUUID()
  await executeInsert(
    'INSERT INTO parking_spots (id, building_id, code, status, vehicle_plate, visitor_name, resident_unit, entry_time, max_duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, spot.building_id, spot.code, spot.status, spot.vehicle_plate, spot.visitor_name, spot.resident_unit, spot.entry_time, spot.max_duration] as InValue[]
  )
}

export async function updateParkingSpot(id: string, updates: Partial<DbParkingSpot>): Promise<void> {
  const fields: string[] = []
  const values: InValue[] = []
  if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status) }
  if (updates.vehicle_plate !== undefined) { fields.push('vehicle_plate = ?'); values.push(updates.vehicle_plate) }
  if (updates.visitor_name !== undefined) { fields.push('visitor_name = ?'); values.push(updates.visitor_name) }
  if (updates.resident_unit !== undefined) { fields.push('resident_unit = ?'); values.push(updates.resident_unit) }
  if (updates.entry_time !== undefined) { fields.push('entry_time = ?'); values.push(updates.entry_time) }
  if (fields.length === 0) return
  values.push(id)
  await executeInsert(
    `UPDATE parking_spots SET ${fields.join(', ')} WHERE id = ?`,
    values
  )
}

export async function deleteParkingSpot(id: string): Promise<void> {
  await executeInsert(
    'DELETE FROM parking_spots WHERE id = ?',
    [id]
  )
}
