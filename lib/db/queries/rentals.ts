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
    [id]
  )
}

export async function getRentalListings(buildingId: string): Promise<DbRentalListing[]> {
  return queryMany<DbRentalListing>(
    'SELECT * FROM rental_listings WHERE building_id = ? ORDER BY created_at DESC',
    [buildingId]
  )
}

export async function createRentalListing(listing: Omit<DbRentalListing, 'id'> & { id?: string }): Promise<void> {
  const id = listing.id ?? crypto.randomUUID()
  await executeInsert(
    'INSERT INTO rental_listings (id, type, owner_id, owner_name, owner_unit, building_id, title, description, price, currency, period, available, available_from, rooms, bathrooms, area, parking_code, contact_phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, listing.type, listing.owner_id, listing.owner_name, listing.owner_unit, listing.building_id, listing.title, listing.description, listing.price, listing.currency, listing.period, listing.available ? 1 : 0, listing.available_from, listing.rooms, listing.bathrooms, listing.area, listing.parking_code, listing.contact_phone, listing.status] as InValue[]
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
    values
  )
}

export async function deleteRentalListing(id: string): Promise<void> {
  await executeInsert(
    'DELETE FROM rental_listings WHERE id = ?',
    [id]
  )
}
