import 'server-only'
import { queryMany, queryOne, executeInsert } from './helpers'
import type { InValue } from './helpers'

export interface DbParkingAssignment {
  id: string
  building_id: string
  spot_code: string
  assignment_type: 'owner' | 'rented' | 'available'
  owner_id: string | null
  owner_name: string | null
  owner_unit: string | null
  tenant_name: string | null
  tenant_unit: string | null
  vehicle_plate: string | null
  vehicle_brand: string | null
  vehicle_color: string | null
  created_at: string
  updated_at: string
}

export async function getParkingAssignments(buildingId: string): Promise<DbParkingAssignment[]> {
  return queryMany<DbParkingAssignment>(
    'SELECT * FROM parking_assignments WHERE building_id = ? ORDER BY spot_code',
    [buildingId]
  )
}

export async function getParkingAssignmentById(id: string): Promise<DbParkingAssignment | null> {
  return queryOne<DbParkingAssignment>(
    'SELECT * FROM parking_assignments WHERE id = ?',
    [id]
  )
}

export async function getParkingAssignmentBySpot(buildingId: string, spotCode: string): Promise<DbParkingAssignment | null> {
  return queryOne<DbParkingAssignment>(
    'SELECT * FROM parking_assignments WHERE building_id = ? AND spot_code = ?',
    [buildingId, spotCode]
  )
}

export async function createOrUpdateParkingAssignment(data: {
  building_id: string
  spot_code: string
  assignment_type: 'owner' | 'rented' | 'available'
  owner_id?: string
  owner_name?: string
  owner_unit?: string
  tenant_name?: string
  tenant_unit?: string
  vehicle_plate?: string
  vehicle_brand?: string
  vehicle_color?: string
}): Promise<void> {
  const existing = await getParkingAssignmentBySpot(data.building_id, data.spot_code)
  
  if (existing) {
    // Update existing
    const fields: string[] = []
    const values: InValue[] = []
    
    fields.push('assignment_type = ?'); values.push(data.assignment_type)
    if (data.owner_id !== undefined) { fields.push('owner_id = ?'); values.push(data.owner_id) }
    if (data.owner_name !== undefined) { fields.push('owner_name = ?'); values.push(data.owner_name) }
    if (data.owner_unit !== undefined) { fields.push('owner_unit = ?'); values.push(data.owner_unit) }
    if (data.tenant_name !== undefined) { fields.push('tenant_name = ?'); values.push(data.tenant_name) }
    if (data.tenant_unit !== undefined) { fields.push('tenant_unit = ?'); values.push(data.tenant_unit) }
    if (data.vehicle_plate !== undefined) { fields.push('vehicle_plate = ?'); values.push(data.vehicle_plate) }
    if (data.vehicle_brand !== undefined) { fields.push('vehicle_brand = ?'); values.push(data.vehicle_brand) }
    if (data.vehicle_color !== undefined) { fields.push('vehicle_color = ?'); values.push(data.vehicle_color) }
    
    values.push(existing.id)
    await executeInsert(
      `UPDATE parking_assignments SET ${fields.join(', ')} WHERE id = ?`,
      values
    )
  } else {
    // Insert new
    const id = crypto.randomUUID()
    await executeInsert(
      `INSERT INTO parking_assignments (id, building_id, spot_code, assignment_type, owner_id, owner_name, owner_unit, tenant_name, tenant_unit, vehicle_plate, vehicle_brand, vehicle_color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, data.building_id, data.spot_code, data.assignment_type,
        data.owner_id ?? null, data.owner_name ?? null, data.owner_unit ?? null,
        data.tenant_name ?? null, data.tenant_unit ?? null,
        data.vehicle_plate ?? null, data.vehicle_brand ?? null, data.vehicle_color ?? null
      ] as InValue[]
    )
  }
}

export async function deleteParkingAssignment(id: string): Promise<void> {
  await executeInsert(
    'DELETE FROM parking_assignments WHERE id = ?',
    [id]
  )
}
