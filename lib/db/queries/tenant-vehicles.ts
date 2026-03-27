import 'server-only'
import { queryMany, queryOne, executeInsert } from './helpers'
import type { InValue } from '@libsql/client'

export interface DbTenantVehicle {
  id: string
  tenant_id: string
  plate: string
  brand: string | null
  model: string | null
  color: string | null
  parking_spot: string | null
  type: string
}

export async function getTenantVehicleById(id: string): Promise<DbTenantVehicle | null> {
  return queryOne<DbTenantVehicle>(
    'SELECT * FROM tenant_vehicles WHERE id = ?',
    [id],
    async (client) => {
      const { data, error } = await client!.from('tenant_vehicles').select('*').eq('id', id).single()
      return { data: data as DbTenantVehicle | null, error }
    }
  )
}

export async function getTenantVehicles(tenantId: string): Promise<DbTenantVehicle[]> {
  return queryMany<DbTenantVehicle>(
    'SELECT * FROM tenant_vehicles WHERE tenant_id = ?',
    [tenantId],
    async (client) => {
      const { data, error } = await client!.from('tenant_vehicles').select('*').eq('tenant_id', tenantId)
      return { data: data as DbTenantVehicle[] | null, error }
    }
  )
}

export async function getTenantVehiclesByBuilding(buildingId: string): Promise<DbTenantVehicle[]> {
  return queryMany<DbTenantVehicle>(
    `SELECT tv.* FROM tenant_vehicles tv JOIN tenants t ON tv.tenant_id = t.id WHERE t.building_id = ?`,
    [buildingId],
    async (client) => {
      const { data, error } = await client!
        .from('tenant_vehicles')
        .select('*, tenants!inner(building_id)')
        .eq('tenants.building_id', buildingId)
      return { data: data as DbTenantVehicle[] | null, error }
    }
  )
}

export async function createTenantVehicle(vehicle: Omit<DbTenantVehicle, 'id'> & { id?: string }): Promise<void> {
  const id = vehicle.id ?? crypto.randomUUID()
  await executeInsert(
    'INSERT INTO tenant_vehicles (id, tenant_id, plate, brand, model, color, parking_spot, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, vehicle.tenant_id, vehicle.plate, vehicle.brand, vehicle.model, vehicle.color, vehicle.parking_spot, vehicle.type] as InValue[],
    async (client) => {
      const { error } = await client!.from('tenant_vehicles').insert({
        id,
        tenant_id: vehicle.tenant_id,
        plate: vehicle.plate,
        brand: vehicle.brand,
        model: vehicle.model,
        color: vehicle.color,
        parking_spot: vehicle.parking_spot,
        type: vehicle.type,
      })
      return { error }
    }
  )
}

export async function updateTenantVehicle(id: string, updates: Partial<DbTenantVehicle>): Promise<void> {
  const fields: string[] = []
  const values: InValue[] = []
  if (updates.plate !== undefined) { fields.push('plate = ?'); values.push(updates.plate) }
  if (updates.brand !== undefined) { fields.push('brand = ?'); values.push(updates.brand) }
  if (updates.model !== undefined) { fields.push('model = ?'); values.push(updates.model) }
  if (updates.color !== undefined) { fields.push('color = ?'); values.push(updates.color) }
  if (updates.parking_spot !== undefined) { fields.push('parking_spot = ?'); values.push(updates.parking_spot) }
  if (fields.length === 0) return
  values.push(id)
  await executeInsert(
    `UPDATE tenant_vehicles SET ${fields.join(', ')} WHERE id = ?`,
    values,
    async (client) => {
      const supabaseUpdates: Record<string, unknown> = {}
      if (updates.plate !== undefined) supabaseUpdates.plate = updates.plate
      if (updates.brand !== undefined) supabaseUpdates.brand = updates.brand
      if (updates.model !== undefined) supabaseUpdates.model = updates.model
      if (updates.color !== undefined) supabaseUpdates.color = updates.color
      if (updates.parking_spot !== undefined) supabaseUpdates.parking_spot = updates.parking_spot
      const { error } = await client!.from('tenant_vehicles').update(supabaseUpdates).eq('id', id)
      return { error }
    }
  )
}

export async function deleteTenantVehicle(id: string): Promise<void> {
  await executeInsert(
    'DELETE FROM tenant_vehicles WHERE id = ?',
    [id],
    async (client) => {
      const { error } = await client!.from('tenant_vehicles').delete().eq('id', id)
      return { error }
    }
  )
}
