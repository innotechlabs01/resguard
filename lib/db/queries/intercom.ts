import 'server-only'
import { queryMany, queryOne, executeInsert } from './helpers'
import type { InValue } from './helpers'

export interface DbIntercomUnit {
  id: string
  building_id: string
  unit_number: string
  owner_id: string | null
  owner_name: string | null
  owner_phone: string | null
  owner_email: string | null
  tenant_id: string | null
  tenant_name: string | null
  tenant_phone: string | null
  tenant_email: string | null
}

export interface DbIntercomCall {
  id: string
  building_id: string
  unit_id: string
  unit_number: string
  caller_type: string
  caller_name: string | null
  caller_message: string | null
  status: string
  created_at: string
  responded_at: string | null
  responded_by: string | null
  response_note: string | null
}

interface DbResidentRow {
  id: string
  building_id: string
  user_id?: string | null
  name: string
  unit: string
  phone: string | null
  email: string | null
  is_tenant?: boolean | number | null
  owner_id?: string | null
  owner_name?: string | null
}

export async function getIntercomUnits(buildingId: string): Promise<DbIntercomUnit[]> {
  const existingUnits = await queryMany<DbIntercomUnit>(
    'SELECT * FROM intercom_units WHERE building_id = ? ORDER BY unit_number',
    [buildingId]
  )

  const unitMap = new Map<string, DbIntercomUnit>()
  for (const u of existingUnits) {
    unitMap.set(u.unit_number, { ...u })
  }

  try {
    const residents = await queryMany<DbResidentRow>(
      'SELECT * FROM residents WHERE building_id = ? ORDER BY unit',
      [buildingId]
    )

    for (const r of residents) {
      if (!r.unit) continue
      const isTenant = Boolean(r.is_tenant)
      const current = unitMap.get(r.unit)

      if (!current) {
        unitMap.set(r.unit, {
          id: r.id,
          building_id: r.building_id,
          unit_number: r.unit,
          owner_id: isTenant ? (r.owner_id ?? null) : (r.user_id ?? r.id),
          owner_name: isTenant ? (r.owner_name ?? null) : r.name,
          owner_phone: isTenant ? null : (r.phone ?? null),
          owner_email: isTenant ? null : (r.email ?? null),
          tenant_id: isTenant ? (r.user_id ?? r.id) : null,
          tenant_name: isTenant ? r.name : null,
          tenant_phone: isTenant ? (r.phone ?? null) : null,
          tenant_email: isTenant ? (r.email ?? null) : null,
        })
      } else {
        if (isTenant) {
          if (!current.tenant_name) current.tenant_name = r.name
          if (!current.tenant_phone) current.tenant_phone = r.phone ?? null
          if (!current.tenant_email) current.tenant_email = r.email ?? null
          if (!current.tenant_id) current.tenant_id = r.user_id ?? r.id
          if (!current.owner_name && r.owner_name) current.owner_name = r.owner_name
        } else {
          if (!current.owner_name) current.owner_name = r.name
          if (!current.owner_phone) current.owner_phone = r.phone ?? null
          if (!current.owner_email) current.owner_email = r.email ?? null
          if (!current.owner_id) current.owner_id = r.user_id ?? r.id
        }
      }
    }
  } catch {
    // Fallback to existingUnits if residents query fails
  }

  return Array.from(unitMap.values()).sort((a, b) =>
    a.unit_number.localeCompare(b.unit_number, undefined, { numeric: true })
  )
}

export async function getIntercomUnitById(id: string): Promise<DbIntercomUnit | null> {
  return queryOne<DbIntercomUnit>(
    'SELECT * FROM intercom_units WHERE id = ?',
    [id]
  )
}

export async function createIntercomCall(call: { building_id: string; unit_id: string; unit_number: string; caller_type: string; caller_name?: string; caller_message?: string }): Promise<string> {
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()

  try {
    await executeInsert(
      'INSERT INTO intercom_calls (id, building_id, unit_id, unit_number, caller_type, caller_name, caller_message, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, call.building_id, call.unit_id, call.unit_number, call.caller_type, call.caller_name ?? null, call.caller_message ?? null, 'pending', createdAt] as InValue[]
    )
  } catch {
    // Fallback with unit_id = null when unit_id comes from synthesized resident row not present in intercom_units
    await executeInsert(
      'INSERT INTO intercom_calls (id, building_id, unit_id, unit_number, caller_type, caller_name, caller_message, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, call.building_id, null, call.unit_number, call.caller_type, call.caller_name ?? null, call.caller_message ?? null, 'pending', createdAt] as InValue[]
    )
  }

  return id
}

export async function getIntercomCalls(buildingId: string, limit = 50): Promise<DbIntercomCall[]> {
  return queryMany<DbIntercomCall>(
    'SELECT * FROM intercom_calls WHERE building_id = ? ORDER BY created_at DESC LIMIT ?',
    [buildingId, limit]
  )
}

export async function getActiveCalls(buildingId: string): Promise<DbIntercomCall[]> {
  return queryMany<DbIntercomCall>(
    'SELECT * FROM intercom_calls WHERE building_id = ? AND status = ? ORDER BY created_at DESC',
    [buildingId, 'pending']
  )
}

export async function respondToCall(callId: string, response: 'approved' | 'rejected', note?: string): Promise<void> {
  const respondedAt = new Date().toISOString()
  
  await executeInsert(
    'UPDATE intercom_calls SET status = ?, responded_at = ?, response_note = ? WHERE id = ?',
    [response, respondedAt, note ?? null, callId] as InValue[]
  )
}

export async function getCallById(callId: string): Promise<DbIntercomCall | null> {
  return queryOne<DbIntercomCall>(
    'SELECT * FROM intercom_calls WHERE id = ?',
    [callId]
  )
}
