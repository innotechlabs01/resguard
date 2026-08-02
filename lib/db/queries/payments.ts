import 'server-only'
import { queryMany, queryOne, executeInsert } from './helpers'

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
    [id]
  )
}

export async function getPaymentByBoldLinkId(boldLinkId: string): Promise<DbPayment | null> {
  return queryOne<DbPayment>(
    'SELECT * FROM payments WHERE bold_link_id = ?',
    [boldLinkId]
  )
}

export async function getPayments(buildingId?: string): Promise<DbPayment[]> {
  if (buildingId) {
    return queryMany<DbPayment>(
      'SELECT * FROM payments WHERE building_id = ? ORDER BY created_at DESC',
      [buildingId]
    )
  }
  return queryMany<DbPayment>(
    'SELECT * FROM payments ORDER BY created_at DESC',
    []
  )
}

export async function createPayment(payment: {
  building_id: string
  building_name?: string
  amount: number
  currency: string
  status: string
  type: string
  description: string
  resident_unit?: string | null
  bold_link_id?: string | null
  bold_url?: string | null
  amount_type?: string
}): Promise<void> {
  const id = crypto.randomUUID()
  await executeInsert(
    `INSERT INTO payments (id, building_id, building_name, amount, currency, status, type, description, resident_unit, bold_link_id, bold_url, amount_type, created_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, 
      payment.building_id, 
      payment.building_name || 'Edificio', 
      payment.amount, 
      payment.currency, 
      payment.status, 
      payment.type, 
      payment.description, 
      payment.resident_unit || null,
      payment.bold_link_id || null,
      payment.bold_url || null,
      payment.amount_type || 'OPEN',
      new Date().toISOString(),
    ]
  )
}

export async function updatePayment(id: string, updates: Partial<DbPayment>): Promise<void> {
  const fields: string[] = []
  const values: (string | number | null)[] = []
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
    values
  )
}

export async function deletePayment(id: string): Promise<void> {
  await executeInsert(
    'DELETE FROM payments WHERE id = ?',
    [id]
  )
}
