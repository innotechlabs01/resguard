import 'server-only'
import { queryMany, queryOne, executeInsert } from './helpers'
import type { InValue } from '@libsql/client'

export interface DbPayment {
  id: string
  building_id: string
  building_name: string
  amount: number
  currency: string
  status: string
  type: string
  description: string
  resident_unit: string | null
  created_at: string
  bold_link_id?: string | null
  bold_url?: string | null
  amount_type?: string | null
  payment_method?: string | null
  transaction_id?: string | null
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

export async function getPaymentByBoldLinkId(boldLinkId: string): Promise<DbPayment | null> {
  return queryOne<DbPayment>(
    'SELECT * FROM payments WHERE bold_link_id = ?',
    [boldLinkId],
    async (client) => {
      const { data, error } = await client!.from('payments').select('*').eq('bold_link_id', boldLinkId).single()
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

export async function createPayment(payment: Omit<DbPayment, 'created_at'> & { id?: string }): Promise<void> {
  const id = payment.id ?? crypto.randomUUID()
  await executeInsert(
    `INSERT INTO payments (id, building_id, building_name, amount, currency, status, type, description, resident_unit, bold_link_id, bold_url, amount_type) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, 
      payment.building_id, 
      payment.building_name || 'Edificio', 
      payment.amount, 
      payment.currency, 
      payment.status, 
      payment.type, 
      payment.description, 
      payment.resident_unit,
      payment.bold_link_id || null,
      payment.bold_url || null,
      payment.amount_type || 'OPEN',
    ] as InValue[],
    async (client) => {
      const { error } = await client!.from('payments').insert({
        id,
        building_id: payment.building_id,
        building_name: payment.building_name || 'Edificio',
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        type: payment.type,
        description: payment.description,
        resident_unit: payment.resident_unit,
        bold_link_id: payment.bold_link_id || null,
        bold_url: payment.bold_url || null,
        amount_type: payment.amount_type || 'OPEN',
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
  if (updates.bold_link_id !== undefined) { fields.push('bold_link_id = ?'); values.push(updates.bold_link_id) }
  if (updates.bold_url !== undefined) { fields.push('bold_url = ?'); values.push(updates.bold_url) }
  if (updates.payment_method !== undefined) { fields.push('payment_method = ?'); values.push(updates.payment_method) }
  if (updates.transaction_id !== undefined) { fields.push('transaction_id = ?'); values.push(updates.transaction_id) }
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
      if (updates.bold_link_id !== undefined) supabaseUpdates.bold_link_id = updates.bold_link_id
      if (updates.bold_url !== undefined) supabaseUpdates.bold_url = updates.bold_url
      if (updates.payment_method !== undefined) supabaseUpdates.payment_method = updates.payment_method
      if (updates.transaction_id !== undefined) supabaseUpdates.transaction_id = updates.transaction_id
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
