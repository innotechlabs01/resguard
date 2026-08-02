import 'server-only'
import { queryMany, queryOne, executeInsert } from './helpers'

export interface DbResident {
  id: string
  building_id: string
  user_id: string | null
  name: string
  unit: string
  phone: string | null
  email: string | null
  parking_spots: string | null
  balance: number
  is_tenant: number
  owner_id: string | null
  owner_name: string | null
  lease_end: string | null
  has_rental_listing: number
  has_marketplace_listing: number
}

export async function getResidentById(id: string): Promise<DbResident | null> {
  return queryOne<DbResident>(
    'SELECT * FROM residents WHERE id = ?',
    [id]
  )
}

export async function getResidents(buildingId: string): Promise<DbResident[]> {
  return queryMany<DbResident>(
    'SELECT * FROM residents WHERE building_id = ? ORDER BY name',
    [buildingId]
  )
}

export async function createResident(resident: {
  building_id: string
  user_id?: string | null
  name: string
  unit: string
  phone?: string | null
  email?: string | null
  parking_spots?: string | null
  balance?: number
  is_tenant?: boolean
  owner_id?: string | null
  owner_name?: string | null
  lease_end?: string | null
  has_rental_listing?: boolean
  has_marketplace_listing?: boolean
}): Promise<void> {
  const id = crypto.randomUUID()
  await executeInsert(
    'INSERT INTO residents (id, building_id, user_id, name, unit, phone, email, parking_spots, balance, is_tenant, owner_id, owner_name, lease_end, has_rental_listing, has_marketplace_listing) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      id, 
      resident.building_id, 
      resident.user_id || null, 
      resident.name, 
      resident.unit, 
      resident.phone || null, 
      resident.email || null, 
      resident.parking_spots || null, 
      resident.balance || 0, 
      resident.is_tenant ? 1 : 0, 
      resident.owner_id || null, 
      resident.owner_name || null, 
      resident.lease_end || null, 
      resident.has_rental_listing ? 1 : 0, 
      resident.has_marketplace_listing ? 1 : 0,
    ]
  )
}

export async function updateResident(id: string, updates: Partial<DbResident>): Promise<void> {
  const fields: string[] = []
  const values: (string | number | null)[] = []
  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name) }
  if (updates.unit !== undefined) { fields.push('unit = ?'); values.push(updates.unit) }
  if (updates.phone !== undefined) { fields.push('phone = ?'); values.push(updates.phone) }
  if (updates.email !== undefined) { fields.push('email = ?'); values.push(updates.email) }
  if (updates.balance !== undefined) { fields.push('balance = ?'); values.push(updates.balance) }
  if (updates.parking_spots !== undefined) { fields.push('parking_spots = ?'); values.push(updates.parking_spots) }
  if (fields.length === 0) return
  values.push(id)
  await executeInsert(
    `UPDATE residents SET ${fields.join(', ')} WHERE id = ?`,
    values
  )
}

export async function deleteResident(id: string): Promise<void> {
  await executeInsert(
    'DELETE FROM residents WHERE id = ?',
    [id]
  )
}
