import 'server-only'
import { queryMany, queryOne, executeInsert } from './helpers'
import type { InValue } from '@libsql/client'

export interface DbRentalListing {
  id: string
  type: string
  owner_id: string
  owner_name: string
  owner_unit: string
  building_id: string
  title: string
  description: string | null
  price: number
  currency: string
  period: string
  available: number | boolean
  available_from: string
  rooms: number | null
  bathrooms: number | null
  area: number | null
  parking_code: string | null
  contact_phone: string
  status: string
}

export async function getRentalListingById(id: string): Promise<DbRentalListing | null> {
  return queryOne<DbRentalListing>(
    'SELECT * FROM rental_listings WHERE id = ?',
    [id],
    async (client) => {
      const { data, error } = await client!.from('rental_listings').select('*').eq('id', id).single()
      return { data: data as DbRentalListing | null, error }
    }
  )
}

export async function getRentalListings(buildingId: string): Promise<DbRentalListing[]> {
  return queryMany<DbRentalListing>(
    'SELECT * FROM rental_listings WHERE building_id = ? ORDER BY created_at DESC',
    [buildingId],
    async (client) => {
      const { data, error } = await client!.from('rental_listings').select('*').eq('building_id', buildingId).order('created_at', { ascending: false })
      return { data: data as DbRentalListing[] | null, error }
    }
  )
}

export async function createRentalListing(listing: Omit<DbRentalListing, 'id'> & { id?: string }): Promise<void> {
  const id = listing.id ?? crypto.randomUUID()
  await executeInsert(
    'INSERT INTO rental_listings (id, type, owner_id, owner_name, owner_unit, building_id, title, description, price, currency, period, available, available_from, rooms, bathrooms, area, parking_code, contact_phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, listing.type, listing.owner_id, listing.owner_name, listing.owner_unit, listing.building_id, listing.title, listing.description, listing.price, listing.currency, listing.period, listing.available ? 1 : 0, listing.available_from, listing.rooms, listing.bathrooms, listing.area, listing.parking_code, listing.contact_phone, listing.status] as InValue[],
    async (client) => {
      const { error } = await client!.from('rental_listings').insert({
        id,
        type: listing.type,
        owner_id: listing.owner_id,
        owner_name: listing.owner_name,
        owner_unit: listing.owner_unit,
        building_id: listing.building_id,
        title: listing.title,
        description: listing.description,
        price: listing.price,
        currency: listing.currency,
        period: listing.period,
        available: listing.available,
        available_from: listing.available_from,
        rooms: listing.rooms,
        bathrooms: listing.bathrooms,
        area: listing.area,
        parking_code: listing.parking_code,
        contact_phone: listing.contact_phone,
        status: listing.status,
      })
      return { error }
    }
  )
}

export async function updateRentalListing(id: string, updates: Partial<DbRentalListing>): Promise<void> {
  const fields: string[] = []
  const values: InValue[] = []
  if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title) }
  if (updates.price !== undefined) { fields.push('price = ?'); values.push(updates.price) }
  if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status) }
  if (updates.available !== undefined) { fields.push('available = ?'); values.push(updates.available ? 1 : 0) }
  if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description) }
  if (fields.length === 0) return
  values.push(id)
  await executeInsert(
    `UPDATE rental_listings SET ${fields.join(', ')} WHERE id = ?`,
    values,
    async (client) => {
      const supabaseUpdates: Record<string, unknown> = {}
      if (updates.title !== undefined) supabaseUpdates.title = updates.title
      if (updates.price !== undefined) supabaseUpdates.price = updates.price
      if (updates.status !== undefined) supabaseUpdates.status = updates.status
      if (updates.available !== undefined) supabaseUpdates.available = updates.available
      if (updates.description !== undefined) supabaseUpdates.description = updates.description
      const { error } = await client!.from('rental_listings').update(supabaseUpdates).eq('id', id)
      return { error }
    }
  )
}

export async function deleteRentalListing(id: string): Promise<void> {
  await executeInsert(
    'DELETE FROM rental_listings WHERE id = ?',
    [id],
    async (client) => {
      const { error } = await client!.from('rental_listings').delete().eq('id', id)
      return { error }
    }
  )
}
