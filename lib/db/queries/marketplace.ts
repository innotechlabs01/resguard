import 'server-only'
import { queryMany, queryOne, executeInsert } from './helpers'
import type { InValue } from '@libsql/client'

export interface DbMarketplaceProduct {
  id: string
  seller_id: string
  seller_name: string
  seller_unit: string
  building_id: string
  title: string
  description: string | null
  price: number
  category: string
  available: number | boolean
  contact_phone: string
  whatsapp: string | null
  created_at: string
}

export async function getMarketplaceProductById(id: string): Promise<DbMarketplaceProduct | null> {
  return queryOne<DbMarketplaceProduct>(
    'SELECT * FROM marketplace_products WHERE id = ?',
    [id],
    async (client) => {
      const { data, error } = await client!.from('marketplace_products').select('*').eq('id', id).single()
      return { data: data as DbMarketplaceProduct | null, error }
    }
  )
}

export async function getMarketplaceProducts(buildingId: string): Promise<DbMarketplaceProduct[]> {
  return queryMany<DbMarketplaceProduct>(
    'SELECT * FROM marketplace_products WHERE building_id = ? ORDER BY created_at DESC',
    [buildingId],
    async (client) => {
      const { data, error } = await client!.from('marketplace_products').select('*').eq('building_id', buildingId).order('created_at', { ascending: false })
      return { data: data as DbMarketplaceProduct[] | null, error }
    }
  )
}

export async function createMarketplaceProduct(product: Omit<DbMarketplaceProduct, 'id' | 'created_at'> & { id?: string }): Promise<void> {
  const id = product.id ?? crypto.randomUUID()
  await executeInsert(
    'INSERT INTO marketplace_products (id, seller_id, seller_name, seller_unit, building_id, title, description, price, category, available, contact_phone, whatsapp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, product.seller_id, product.seller_name, product.seller_unit, product.building_id, product.title, product.description, product.price, product.category, product.available ? 1 : 0, product.contact_phone, product.whatsapp] as InValue[],
    async (client) => {
      const { error } = await client!.from('marketplace_products').insert({
        id,
        seller_id: product.seller_id,
        seller_name: product.seller_name,
        seller_unit: product.seller_unit,
        building_id: product.building_id,
        title: product.title,
        description: product.description,
        price: product.price,
        category: product.category,
        available: product.available,
        contact_phone: product.contact_phone,
        whatsapp: product.whatsapp,
      })
      return { error }
    }
  )
}

export async function updateMarketplaceProduct(id: string, updates: Partial<DbMarketplaceProduct>): Promise<void> {
  const fields: string[] = []
  const values: InValue[] = []
  if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title) }
  if (updates.price !== undefined) { fields.push('price = ?'); values.push(updates.price) }
  if (updates.available !== undefined) { fields.push('available = ?'); values.push(updates.available ? 1 : 0) }
  if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description) }
  if (fields.length === 0) return
  values.push(id)
  await executeInsert(
    `UPDATE marketplace_products SET ${fields.join(', ')} WHERE id = ?`,
    values,
    async (client) => {
      const supabaseUpdates: Record<string, unknown> = {}
      if (updates.title !== undefined) supabaseUpdates.title = updates.title
      if (updates.price !== undefined) supabaseUpdates.price = updates.price
      if (updates.available !== undefined) supabaseUpdates.available = updates.available
      if (updates.description !== undefined) supabaseUpdates.description = updates.description
      const { error } = await client!.from('marketplace_products').update(supabaseUpdates).eq('id', id)
      return { error }
    }
  )
}

export async function deleteMarketplaceProduct(id: string): Promise<void> {
  await executeInsert(
    'DELETE FROM marketplace_products WHERE id = ?',
    [id],
    async (client) => {
      const { error } = await client!.from('marketplace_products').delete().eq('id', id)
      return { error }
    }
  )
}
