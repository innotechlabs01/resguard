import 'server-only'
import { queryMany, queryOne, executeInsert } from './helpers'
import type { InValue } from './helpers'

export interface DbTenant {
  id: string
  building_id: string
  name: string
  document_id: string
  phone: string | null
  email: string | null
  unit: string
  owner_id: string
  owner_name: string
  owner_unit: string
  lease_start: string
  lease_end: string
  monthly_rent: number
  deposit_paid: number
  status: string
}

export async function getTenantById(id: string): Promise<DbTenant | null> {
  return queryOne<DbTenant>(
    'SELECT * FROM tenants WHERE id = ?',
    [id]
  )
}

export async function getTenants(buildingId: string): Promise<DbTenant[]> {
  return queryMany<DbTenant>(
    'SELECT * FROM tenants WHERE building_id = ? ORDER BY name',
    [buildingId]
  )
}

export async function createTenant(tenant: Omit<DbTenant, 'id'> & { id?: string }): Promise<void> {
  const id = tenant.id ?? crypto.randomUUID()
  await executeInsert(
    'INSERT INTO tenants (id, building_id, name, document_id, phone, email, unit, owner_id, owner_name, owner_unit, lease_start, lease_end, monthly_rent, deposit_paid, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, tenant.building_id, tenant.name, tenant.document_id, tenant.phone, tenant.email, tenant.unit, tenant.owner_id, tenant.owner_name, tenant.owner_unit, tenant.lease_start, tenant.lease_end, tenant.monthly_rent, tenant.deposit_paid, tenant.status] as InValue[]
  )
}

export async function updateTenant(id: string, updates: Partial<DbTenant>): Promise<void> {
  const fields: string[] = []
  const values: InValue[] = []
  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name) }
  if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status) }
  if (updates.monthly_rent !== undefined) { fields.push('monthly_rent = ?'); values.push(updates.monthly_rent) }
  if (updates.lease_end !== undefined) { fields.push('lease_end = ?'); values.push(updates.lease_end) }
  if (updates.phone !== undefined) { fields.push('phone = ?'); values.push(updates.phone) }
  if (updates.email !== undefined) { fields.push('email = ?'); values.push(updates.email) }
  if (fields.length === 0) return
  values.push(id)
  await executeInsert(
    `UPDATE tenants SET ${fields.join(', ')} WHERE id = ?`,
    values
  )
}

export async function deleteTenant(id: string): Promise<void> {
  await executeInsert(
    'DELETE FROM tenants WHERE id = ?',
    [id]
  )
}
