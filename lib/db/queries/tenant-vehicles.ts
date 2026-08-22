import 'server-only'
import { queryMany, queryOne, executeInsert } from './helpers'
import type { InValue } from './helpers'

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
    [id]
  )
}

export async function getTenantVehicles(tenantId: string): Promise<DbTenantVehicle[]> {
  return queryMany<DbTenantVehicle>(
    'SELECT * FROM tenant_vehicles WHERE tenant_id = ?',
    [tenantId]
  )
}

export async function getTenantVehiclesByBuilding(buildingId: string): Promise<DbTenantVehicle[]> {
  return queryMany<DbTenantVehicle>(
    `SELECT tv.* FROM tenant_vehicles tv JOIN tenants t ON tv.tenant_id = t.id WHERE t.building_id = ?`,
    [buildingId]
  )
}

export async function createTenantVehicle(vehicle: Omit<DbTenantVehicle, 'id'> & { id?: string }): Promise<void> {
  const id = vehicle.id ?? crypto.randomUUID()
  await executeInsert(
    'INSERT INTO tenant_vehicles (id, tenant_id, plate, brand, model, color, parking_spot, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, vehicle.tenant_id, vehicle.plate, vehicle.brand, vehicle.model, vehicle.color, vehicle.parking_spot, vehicle.type] as InValue[]
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
    values
  )
}

export async function deleteTenantVehicle(id: string): Promise<void> {
  await executeInsert(
    'DELETE FROM tenant_vehicles WHERE id = ?',
    [id]
  )
}
