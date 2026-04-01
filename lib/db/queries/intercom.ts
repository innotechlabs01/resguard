import 'server-only'
import { queryMany, queryOne, executeInsert } from './helpers'
import type { InValue } from '@libsql/client'

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

export async function getIntercomUnits(buildingId: string): Promise<DbIntercomUnit[]> {
  return queryMany<DbIntercomUnit>(
    'SELECT * FROM intercom_units WHERE building_id = ? ORDER BY unit_number',
    [buildingId],
    async (client: any) => {
      const { data, error } = await client.from('intercom_units').select('*').eq('building_id', buildingId).order('unit_number', { ascending: true })
      return { data: data as DbIntercomUnit[] | null, error }
    }
  )
}

export async function getIntercomUnitById(id: string): Promise<DbIntercomUnit | null> {
  return queryOne<DbIntercomUnit>(
    'SELECT * FROM intercom_units WHERE id = ?',
    [id],
    async (client: any) => {
      const { data, error } = await client.from('intercom_units').select('*').eq('id', id).single()
      return { data: data as DbIntercomUnit | null, error }
    }
  )
}

export async function createIntercomCall(call: { building_id: string; unit_id: string; unit_number: string; caller_type: string; caller_name?: string; caller_message?: string }): Promise<string> {
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  
  await executeInsert(
    'INSERT INTO intercom_calls (id, building_id, unit_id, unit_number, caller_type, caller_name, caller_message, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, call.building_id, call.unit_id, call.unit_number, call.caller_type, call.caller_name ?? null, call.caller_message ?? null, 'pending', createdAt] as InValue[],
    async (client: any) => {
      const { error } = await client.from('intercom_calls').insert({
        id,
        building_id: call.building_id,
        unit_id: call.unit_id,
        unit_number: call.unit_number,
        caller_type: call.caller_type,
        caller_name: call.caller_name,
        caller_message: call.caller_message,
        status: 'pending',
        created_at: createdAt,
      })
      return { error }
    }
  )
  
  return id
}

export async function getIntercomCalls(buildingId: string, limit = 50): Promise<DbIntercomCall[]> {
  return queryMany<DbIntercomCall>(
    'SELECT * FROM intercom_calls WHERE building_id = ? ORDER BY created_at DESC LIMIT ?',
    [buildingId, limit],
    async (client: any) => {
      const { data, error } = await client.from('intercom_calls').select('*').eq('building_id', buildingId).order('created_at', { ascending: false }).limit(limit)
      return { data: data as DbIntercomCall[] | null, error }
    }
  )
}

export async function getActiveCalls(buildingId: string): Promise<DbIntercomCall[]> {
  return queryMany<DbIntercomCall>(
    'SELECT * FROM intercom_calls WHERE building_id = ? AND status = ? ORDER BY created_at DESC',
    [buildingId, 'pending'],
    async (client: any) => {
      const { data, error } = await client.from('intercom_calls').select('*').eq('building_id', buildingId).eq('status', 'pending').order('created_at', { ascending: false })
      return { data: data as DbIntercomCall[] | null, error }
    }
  )
}

export async function respondToCall(callId: string, response: 'approved' | 'rejected', note?: string): Promise<void> {
  const respondedAt = new Date().toISOString()
  
  await executeInsert(
    'UPDATE intercom_calls SET status = ?, responded_at = ?, response_note = ? WHERE id = ?',
    [response, respondedAt, note ?? null, callId] as InValue[],
    async (client: any) => {
      const { error } = await client.from('intercom_calls').update({
        status: response,
        responded_at: respondedAt,
        response_note: note,
      }).eq('id', callId)
      return { error }
    }
  )
}

export async function getCallById(callId: string): Promise<DbIntercomCall | null> {
  return queryOne<DbIntercomCall>(
    'SELECT * FROM intercom_calls WHERE id = ?',
    [callId],
    async (client: any) => {
      const { data, error } = await client.from('intercom_calls').select('*').eq('id', callId).single()
      return { data: data as DbIntercomCall | null, error }
    }
  )
}