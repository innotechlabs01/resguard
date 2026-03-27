import 'server-only'
import { queryMany, queryOne } from './helpers'

export interface DbBuilding {
  id: string
  name: string
  address: string
  total_units: number
  total_parking_spots: number
  visitor_parking_spots: number
  stripe_account_id: string | null
  monthly_fee: number
  currency: string
  outstanding_balance: number
  last_payment_date: string | null
  subscription_status: string
}

function mapBuilding(row: Record<string, unknown>): DbBuilding {
  return {
    id: row.id as string,
    name: row.name as string,
    address: row.address as string,
    total_units: (row.total_units ?? row.totalUnits) as number,
    total_parking_spots: (row.total_parking_spots ?? row.totalParkingSpots) as number,
    visitor_parking_spots: (row.visitor_parking_spots ?? row.visitorParkingSpots) as number,
    stripe_account_id: (row.stripe_account_id ?? row.stripeAccountId) as string | null,
    monthly_fee: (row.monthly_fee ?? row.monthlyFee) as number,
    currency: row.currency as string,
    outstanding_balance: (row.outstanding_balance ?? row.outstandingBalance) as number,
    last_payment_date: (row.last_payment_date ?? row.lastPaymentDate) as string | null,
    subscription_status: (row.subscription_status ?? row.subscriptionStatus) as string,
  }
}

export async function getBuildings(): Promise<DbBuilding[]> {
  const rows = await queryMany<Record<string, unknown>>(
    'SELECT * FROM buildings ORDER BY name',
    [],
    async (client) => {
      const { data, error } = await client!.from('buildings').select('*').order('name')
      return { data: data as Record<string, unknown>[] | null, error }
    }
  )
  return rows.map(mapBuilding)
}

export async function getBuildingById(id: string): Promise<DbBuilding | null> {
  const row = await queryOne<Record<string, unknown>>(
    'SELECT * FROM buildings WHERE id = ?',
    [id],
    async (client) => {
      const { data, error } = await client!.from('buildings').select('*').eq('id', id).single()
      return { data: data as Record<string, unknown> | null, error }
    }
  )
  return row ? mapBuilding(row) : null
}

export async function createBuilding(building: Omit<DbBuilding, 'id'> & { id?: string }): Promise<void> {
  const { executeInsert } = await import('./helpers')
  const id = building.id ?? crypto.randomUUID()
  await executeInsert(
    'INSERT INTO buildings (id, name, address, total_units, total_parking_spots, visitor_parking_spots, stripe_account_id, monthly_fee, currency, outstanding_balance, last_payment_date, subscription_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, building.name, building.address, building.total_units, building.total_parking_spots, building.visitor_parking_spots, building.stripe_account_id, building.monthly_fee, building.currency, building.outstanding_balance, building.last_payment_date, building.subscription_status],
    async (client) => {
      const { error } = await client!.from('buildings').insert({
        id,
        name: building.name,
        address: building.address,
        total_units: building.total_units,
        total_parking_spots: building.total_parking_spots,
        visitor_parking_spots: building.visitor_parking_spots,
        stripe_account_id: building.stripe_account_id,
        monthly_fee: building.monthly_fee,
        currency: building.currency,
        outstanding_balance: building.outstanding_balance,
        last_payment_date: building.last_payment_date,
        subscription_status: building.subscription_status,
      })
      return { error }
    }
  )
}

export async function updateBuilding(id: string, updates: Partial<DbBuilding>): Promise<void> {
  const { executeInsert } = await import('./helpers')
  const fields: string[] = []
  const values: (string | number | null)[] = []

  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name) }
  if (updates.address !== undefined) { fields.push('address = ?'); values.push(updates.address) }
  if (updates.total_units !== undefined) { fields.push('total_units = ?'); values.push(updates.total_units) }
  if (updates.total_parking_spots !== undefined) { fields.push('total_parking_spots = ?'); values.push(updates.total_parking_spots) }
  if (updates.visitor_parking_spots !== undefined) { fields.push('visitor_parking_spots = ?'); values.push(updates.visitor_parking_spots) }
  if (updates.monthly_fee !== undefined) { fields.push('monthly_fee = ?'); values.push(updates.monthly_fee) }
  if (updates.currency !== undefined) { fields.push('currency = ?'); values.push(updates.currency) }
  if (updates.outstanding_balance !== undefined) { fields.push('outstanding_balance = ?'); values.push(updates.outstanding_balance) }
  if (updates.last_payment_date !== undefined) { fields.push('last_payment_date = ?'); values.push(updates.last_payment_date) }
  if (updates.subscription_status !== undefined) { fields.push('subscription_status = ?'); values.push(updates.subscription_status) }
  if (updates.stripe_account_id !== undefined) { fields.push('stripe_account_id = ?'); values.push(updates.stripe_account_id) }

  if (fields.length === 0) return

  values.push(id)
  await executeInsert(
    `UPDATE buildings SET ${fields.join(', ')} WHERE id = ?`,
    values,
    async (client) => {
      const supabaseUpdates: Record<string, unknown> = {}
      if (updates.name !== undefined) supabaseUpdates.name = updates.name
      if (updates.address !== undefined) supabaseUpdates.address = updates.address
      if (updates.total_units !== undefined) supabaseUpdates.total_units = updates.total_units
      if (updates.total_parking_spots !== undefined) supabaseUpdates.total_parking_spots = updates.total_parking_spots
      if (updates.visitor_parking_spots !== undefined) supabaseUpdates.visitor_parking_spots = updates.visitor_parking_spots
      if (updates.monthly_fee !== undefined) supabaseUpdates.monthly_fee = updates.monthly_fee
      if (updates.currency !== undefined) supabaseUpdates.currency = updates.currency
      if (updates.outstanding_balance !== undefined) supabaseUpdates.outstanding_balance = updates.outstanding_balance
      if (updates.last_payment_date !== undefined) supabaseUpdates.last_payment_date = updates.last_payment_date
      if (updates.subscription_status !== undefined) supabaseUpdates.subscription_status = updates.subscription_status
      if (updates.stripe_account_id !== undefined) supabaseUpdates.stripe_account_id = updates.stripe_account_id
      const { error } = await client!.from('buildings').update(supabaseUpdates).eq('id', id)
      return { error }
    }
  )
}
