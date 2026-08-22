import 'server-only'
import { queryMany, queryOne, executeInsert } from './helpers'
import type { InValue } from './helpers'

export interface DbMaintenanceSchedule {
  id: string
  building_id: string
  title: string
  description: string | null
  category: string
  frequency: string
  next_due: string
  last_completed: string | null
  assigned_provider: string | null
  assigned_provider_phone: string | null
  estimated_cost: number | null
  priority: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DbWorkOrder {
  id: string
  schedule_id: string | null
  building_id: string
  title: string
  description: string | null
  category: string
  status: string
  priority: string
  assigned_provider: string | null
  assigned_provider_phone: string | null
  scheduled_date: string | null
  completed_date: string | null
  actual_cost: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ── List active schedules for a building ──

export async function getSchedules(buildingId: string): Promise<DbMaintenanceSchedule[]> {
  return queryMany<DbMaintenanceSchedule>(
    'SELECT * FROM maintenance_schedules WHERE building_id = ? AND is_active = ? ORDER BY next_due ASC',
    [buildingId, true]
  )
}

// ── Create a maintenance schedule ──

export async function createSchedule(data: {
  building_id: string
  title: string
  description?: string
  category: string
  frequency: string
  next_due: string
  assigned_provider?: string
  assigned_provider_phone?: string
  estimated_cost?: number
  priority?: string
}): Promise<DbMaintenanceSchedule> {
  const id = crypto.randomUUID()
  await executeInsert(
    `INSERT INTO maintenance_schedules (id, building_id, title, description, category, frequency, next_due, assigned_provider, assigned_provider_phone, estimated_cost, priority)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.building_id,
      data.title,
      data.description || null,
      data.category,
      data.frequency,
      data.next_due,
      data.assigned_provider || null,
      data.assigned_provider_phone || null,
      data.estimated_cost ?? null,
      data.priority || 'normal',
    ]
  )
  const created = await queryOne<DbMaintenanceSchedule>(
    'SELECT * FROM maintenance_schedules WHERE id = ?',
    [id]
  )
  return created!
}

// ── Update a maintenance schedule ──

export async function updateSchedule(
  id: string,
  data: Partial<{
    title: string
    description: string
    category: string
    frequency: string
    next_due: string
    last_completed: string
    assigned_provider: string
    assigned_provider_phone: string
    estimated_cost: number
    priority: string
  }>
): Promise<void> {
  const fields: string[] = []
  const values: InValue[] = []

  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      fields.push(`${key} = ?`)
      values.push(val as InValue)
    }
  }

  if (fields.length === 0) return
  values.push(id)
  await executeInsert(
    `UPDATE maintenance_schedules SET ${fields.join(', ')} WHERE id = ?`,
    values
  )
}

// ── Soft-delete a schedule ──

export async function deleteSchedule(id: string): Promise<void> {
  await executeInsert(
    'UPDATE maintenance_schedules SET is_active = ? WHERE id = ?',
    [false, id]
  )
}

// ── List work orders ──

export async function getWorkOrders(
  buildingId: string,
  filters?: { status?: string; category?: string }
): Promise<DbWorkOrder[]> {
  const conditions: InValue[] = [buildingId]
  const wheres: string[] = ['building_id = ?']

  if (filters?.status) {
    wheres.push('status = ?')
    conditions.push(filters.status)
  }
  if (filters?.category) {
    wheres.push('category = ?')
    conditions.push(filters.category)
  }

  const sql = `SELECT * FROM work_orders WHERE ${wheres.join(' AND ')} ORDER BY scheduled_date ASC, created_at DESC`
  return queryMany<DbWorkOrder>(sql, conditions)
}

// ── Get work order by ID ──

export async function getWorkOrderById(id: string): Promise<DbWorkOrder | null> {
  return queryOne<DbWorkOrder>(
    'SELECT * FROM work_orders WHERE id = ?',
    [id]
  )
}

// ── Create a work order ──

export async function createWorkOrder(data: {
  schedule_id?: string
  building_id: string
  title: string
  description?: string
  category: string
  priority?: string
  assigned_provider?: string
  assigned_provider_phone?: string
  scheduled_date?: string
}): Promise<DbWorkOrder> {
  const id = crypto.randomUUID()
  await executeInsert(
    `INSERT INTO work_orders (id, schedule_id, building_id, title, description, category, priority, assigned_provider, assigned_provider_phone, scheduled_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.schedule_id || null,
      data.building_id,
      data.title,
      data.description || null,
      data.category,
      data.priority || 'normal',
      data.assigned_provider || null,
      data.assigned_provider_phone || null,
      data.scheduled_date || null,
    ]
  )
  const created = await getWorkOrderById(id)
  return created!
}

// ── Update work order status ──

export async function updateWorkOrderStatus(
  id: string,
  status: string,
  notes?: string
): Promise<void> {
  const fields: string[] = ['status = ?']
  const values: InValue[] = [status]

  if (status === 'completed') {
    fields.push('completed_date = ?')
    values.push(new Date().toISOString().split('T')[0])
  }
  if (notes) {
    fields.push('notes = ?')
    values.push(notes)
  }

  values.push(id)
  await executeInsert(
    `UPDATE work_orders SET ${fields.join(', ')} WHERE id = ?`,
    values
  )
}

// ── Get upcoming maintenance (next_due within 7 days) ──

export async function getUpcomingMaintenance(buildingId: string): Promise<DbMaintenanceSchedule[]> {
  const today = new Date().toISOString().split('T')[0]
  const weekFromNow = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  return queryMany<DbMaintenanceSchedule>(
    'SELECT * FROM maintenance_schedules WHERE building_id = ? AND is_active = ? AND next_due >= ? AND next_due <= ? ORDER BY next_due ASC',
    [buildingId, true, today, weekFromNow]
  )
}

// ── Generate work orders from overdue schedules ──

export async function generateWorkOrdersFromSchedules(buildingId: string): Promise<DbWorkOrder[]> {
  const today = new Date().toISOString().split('T')[0]
  const schedules = await queryMany<DbMaintenanceSchedule>(
    'SELECT * FROM maintenance_schedules WHERE building_id = ? AND is_active = ? AND next_due <= ?',
    [buildingId, true, today]
  )

  const created: DbWorkOrder[] = []
  for (const schedule of schedules) {
    const order = await createWorkOrder({
      schedule_id: schedule.id,
      building_id: schedule.building_id,
      title: schedule.title,
      description: schedule.description || undefined,
      category: schedule.category,
      priority: schedule.priority,
      assigned_provider: schedule.assigned_provider || undefined,
      assigned_provider_phone: schedule.assigned_provider_phone || undefined,
      scheduled_date: schedule.next_due,
    })
    created.push(order)

    // Calculate next due based on frequency
    const nextDue = calculateNextDue(schedule.next_due, schedule.frequency)
    await updateSchedule(schedule.id, {
      last_completed: schedule.next_due,
      next_due: nextDue,
    })
  }

  return created
}

// ── Helper: calculate next due date ──

function calculateNextDue(currentDue: string, frequency: string): string {
  const date = new Date(currentDue)
  switch (frequency) {
    case 'weekly':
      date.setDate(date.getDate() + 7)
      break
    case 'biweekly':
      date.setDate(date.getDate() + 14)
      break
    case 'monthly':
      date.setMonth(date.getMonth() + 1)
      break
    case 'quarterly':
      date.setMonth(date.getMonth() + 3)
      break
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1)
      break
  }
  return date.toISOString().split('T')[0]
}
