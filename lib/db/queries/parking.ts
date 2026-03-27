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
    [id],
    async (client) => {
      const { data, error } = await client!.from('parking_spots').select('*').eq('id', id).single()
      return { data: data as DbParkingSpot | null, error }
    }
  )
}

export async function getParkingSpots(buildingId: string): Promise<DbParkingSpot[]> {
  return queryMany<DbParkingSpot>(
    'SELECT * FROM parking_spots WHERE building_id = ? ORDER BY code',
    [buildingId],
    async (client) => {
      const { data, error } = await client!.from('parking_spots').select('*').eq('building_id', buildingId).order('code')
      return { data: data as DbParkingSpot[] | null, error }
    }
  )
}

export async function createParkingSpot(spot: Omit<DbParkingSpot, 'id'> & { id?: string }): Promise<void> {
  const id = spot.id ?? crypto.randomUUID()
  await executeInsert(
    'INSERT INTO parking_spots (id, building_id, code, status, vehicle_plate, visitor_name, resident_unit, entry_time, max_duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, spot.building_id, spot.code, spot.status, spot.vehicle_plate, spot.visitor_name, spot.resident_unit, spot.entry_time, spot.max_duration] as InValue[],
    async (client) => {
      const { error } = await client!.from('parking_spots').insert({
        id,
        building_id: spot.building_id,
        code: spot.code,
        status: spot.status,
        vehicle_plate: spot.vehicle_plate,
        visitor_name: spot.visitor_name,
        resident_unit: spot.resident_unit,
        entry_time: spot.entry_time,
        max_duration: spot.max_duration,
      })
      return { error }
    }
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
    values,
    async (client) => {
      const supabaseUpdates: Record<string, unknown> = {}
      if (updates.status !== undefined) supabaseUpdates.status = updates.status
      if (updates.vehicle_plate !== undefined) supabaseUpdates.vehicle_plate = updates.vehicle_plate
      if (updates.visitor_name !== undefined) supabaseUpdates.visitor_name = updates.visitor_name
      if (updates.resident_unit !== undefined) supabaseUpdates.resident_unit = updates.resident_unit
      if (updates.entry_time !== undefined) supabaseUpdates.entry_time = updates.entry_time
      const { error } = await client!.from('parking_spots').update(supabaseUpdates).eq('id', id)
      return { error }
    }
  )
}

export async function deleteParkingSpot(id: string): Promise<void> {
  await executeInsert(
    'DELETE FROM parking_spots WHERE id = ?',
    [id],
    async (client) => {
      const { error } = await client!.from('parking_spots').delete().eq('id', id)
      return { error }
    }
  )
}
