import 'server-only'
import { queryMany, queryOne, executeInsert } from './helpers'
import type { InValue } from '@libsql/client'

export interface DbPayment {
  id: string
  building_id: string
  amount: number
  currency: string
  status: string
  type: string
  description: string
  resident_unit: string | null
  created_at: string
}

export async function getPaymentById(id: string): Promise<DbPayment | null> {
  return queryOne<DbPayment>(
    'SELECT * FROM payments WHERE id = ?',
    [id],
    async (client) => {
      const { data, error } = await client!.from('payments').select('*').eq('id', id).single()
      return { data: data as DbPayment | null, error }
    }
  )
}

export async function getPayments(buildingId?: string): Promise<DbPayment[]> {
  if (buildingId) {
    return queryMany<DbPayment>(
      'SELECT * FROM payments WHERE building_id = ? ORDER BY created_at DESC',
      [buildingId],
      async (client) => {
        const { data, error } = await client!.from('payments').select('*').eq('building_id', buildingId).order('created_at', { ascending: false })
        return { data: data as DbPayment[] | null, error }
      }
    )
  }
  return queryMany<DbPayment>(
    'SELECT * FROM payments ORDER BY created_at DESC',
    [],
    async (client) => {
      const { data, error } = await client!.from('payments').select('*').order('created_at', { ascending: false })
      return { data: data as DbPayment[] | null, error }
    }
  )
}

export async function createPayment(payment: Omit<DbPayment, 'id' | 'created_at'> & { id?: string }): Promise<void> {
  const id = payment.id ?? crypto.randomUUID()
  await executeInsert(
    'INSERT INTO payments (id, building_id, amount, currency, status, type, description, resident_unit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, payment.building_id, payment.amount, payment.currency, payment.status, payment.type, payment.description, payment.resident_unit] as InValue[],
    async (client) => {
      const { error } = await client!.from('payments').insert({
        id,
        building_id: payment.building_id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        type: payment.type,
        description: payment.description,
        resident_unit: payment.resident_unit,
      })
      return { error }
    }
  )
}

export async function updatePayment(id: string, updates: Partial<DbPayment>): Promise<void> {
  const fields: string[] = []
  const values: InValue[] = []
  if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status) }
  if (updates.amount !== undefined) { fields.push('amount = ?'); values.push(updates.amount) }
  if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description) }
  if (fields.length === 0) return
  values.push(id)
  await executeInsert(
    `UPDATE payments SET ${fields.join(', ')} WHERE id = ?`,
    values,
    async (client) => {
      const supabaseUpdates: Record<string, unknown> = {}
      if (updates.status !== undefined) supabaseUpdates.status = updates.status
      if (updates.amount !== undefined) supabaseUpdates.amount = updates.amount
      if (updates.description !== undefined) supabaseUpdates.description = updates.description
      const { error } = await client!.from('payments').update(supabaseUpdates).eq('id', id)
      return { error }
    }
  )
}

export async function deletePayment(id: string): Promise<void> {
  await executeInsert(
    'DELETE FROM payments WHERE id = ?',
    [id],
    async (client) => {
      const { error } = await client!.from('payments').delete().eq('id', id)
      return { error }
    }
  )
}
