import 'server-only'
import { queryMany, queryOne, executeInsert } from './helpers'
import type { InValue } from '@libsql/client'

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
  is_tenant: number | boolean
  owner_id: string | null
  owner_name: string | null
  lease_end: string | null
  has_rental_listing: number | boolean | null
  has_marketplace_listing: number | boolean | null
}

export async function getResidentById(id: string): Promise<DbResident | null> {
  return queryOne<DbResident>(
    'SELECT * FROM residents WHERE id = ?',
    [id],
    async (client) => {
      const { data, error } = await client!.from('residents').select('*').eq('id', id).single()
      return { data: data as DbResident | null, error }
    }
  )
}

export async function getResidents(buildingId: string): Promise<DbResident[]> {
  return queryMany<DbResident>(
    'SELECT * FROM residents WHERE building_id = ? ORDER BY name',
    [buildingId],
    async (client) => {
      const { data, error } = await client!.from('residents').select('*').eq('building_id', buildingId).order('name')
      return { data: data as DbResident[] | null, error }
    }
  )
}

export async function createResident(resident: Omit<DbResident, 'id'> & { id?: string }): Promise<void> {
  const id = resident.id ?? crypto.randomUUID()
  await executeInsert(
    'INSERT INTO residents (id, building_id, user_id, name, unit, phone, email, parking_spots, balance, is_tenant, owner_id, owner_name, lease_end, has_rental_listing, has_marketplace_listing) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, resident.building_id, resident.user_id, resident.name, resident.unit, resident.phone, resident.email, resident.parking_spots, resident.balance, resident.is_tenant ? 1 : 0, resident.owner_id, resident.owner_name, resident.lease_end, resident.has_rental_listing ? 1 : 0, resident.has_marketplace_listing ? 1 : 0] as InValue[],
    async (client) => {
      const { error } = await client!.from('residents').insert({
        id,
        building_id: resident.building_id,
        user_id: resident.user_id,
        name: resident.name,
        unit: resident.unit,
        phone: resident.phone,
        email: resident.email,
        parking_spots: resident.parking_spots,
        balance: resident.balance,
        is_tenant: resident.is_tenant,
        owner_id: resident.owner_id,
        owner_name: resident.owner_name,
        lease_end: resident.lease_end,
        has_rental_listing: resident.has_rental_listing,
        has_marketplace_listing: resident.has_marketplace_listing,
      })
      return { error }
    }
  )
}

export async function updateResident(id: string, updates: Partial<DbResident>): Promise<void> {
  const fields: string[] = []
  const values: InValue[] = []
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
    values,
    async (client) => {
      const supabaseUpdates: Record<string, unknown> = {}
      if (updates.name !== undefined) supabaseUpdates.name = updates.name
      if (updates.unit !== undefined) supabaseUpdates.unit = updates.unit
      if (updates.phone !== undefined) supabaseUpdates.phone = updates.phone
      if (updates.email !== undefined) supabaseUpdates.email = updates.email
      if (updates.balance !== undefined) supabaseUpdates.balance = updates.balance
      if (updates.parking_spots !== undefined) supabaseUpdates.parking_spots = updates.parking_spots
      const { error } = await client!.from('residents').update(supabaseUpdates).eq('id', id)
      return { error }
    }
  )
}

export async function deleteResident(id: string): Promise<void> {
  await executeInsert(
    'DELETE FROM residents WHERE id = ?',
    [id],
    async (client) => {
      const { error } = await client!.from('residents').delete().eq('id', id)
      return { error }
    }
  )
}
