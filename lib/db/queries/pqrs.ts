import 'server-only'
import { queryMany, queryOne, executeInsert } from './helpers'
import type { InValue } from './helpers'

export interface DbPqrs {
  id: string
  building_id: string
  created_by: string
  created_by_name: string
  created_by_unit: string | null
  subject: string
  description: string
  category: string
  priority: string
  status: string
  unit: string | null
  location_detail: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
  first_response_at: string | null
}

export interface DbPqrsComment {
  id: string
  pqrs_id: string
  author_id: string
  author_name: string
  author_role: string
  content: string
  is_internal: boolean
  created_at: string
}

// ── List PQRS with optional filters ──

export async function getPqrs(
  buildingId: string,
  filters?: {
    status?: string
    category?: string
    priority?: string
  }
): Promise<DbPqrs[]> {
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
  if (filters?.priority) {
    wheres.push('priority = ?')
    conditions.push(filters.priority)
  }

  const sql = `SELECT * FROM pqrs WHERE ${wheres.join(' AND ')} ORDER BY created_at DESC`
  return queryMany<DbPqrs>(sql, conditions)
}

// ── Get PQRS by ID ──

export async function getPqrsById(id: string): Promise<DbPqrs | null> {
  return queryOne<DbPqrs>(
    'SELECT * FROM pqrs WHERE id = ?',
    [id]
  )
}

// ── Get PQRS created by a specific user ──

export async function getPqrsByUser(userId: string): Promise<DbPqrs[]> {
  return queryMany<DbPqrs>(
    'SELECT * FROM pqrs WHERE created_by = ? ORDER BY created_at DESC',
    [userId]
  )
}

// ── Create PQRS ──

export async function createPqrs(data: {
  building_id: string
  created_by: string
  created_by_name: string
  created_by_unit?: string | null
  subject: string
  description: string
  category: string
  priority?: string
  unit?: string | null
  location_detail?: string | null
}): Promise<DbPqrs> {
  const id = crypto.randomUUID()
  await executeInsert(
    `INSERT INTO pqrs (id, building_id, created_by, created_by_name, created_by_unit, subject, description, category, priority, unit, location_detail)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.building_id,
      data.created_by,
      data.created_by_name,
      data.created_by_unit || null,
      data.subject,
      data.description,
      data.category,
      data.priority || 'normal',
      data.unit || null,
      data.location_detail || null,
    ]
  )
  const created = await getPqrsById(id)
  return created!
}

// ── Update PQRS status ──

export async function updatePqrsStatus(
  id: string,
  status: string,
  adminName?: string
): Promise<void> {
  const fields: string[] = ['status = ?']
  const values: InValue[] = [status]

  if (status === 'resolved') {
    fields.push('resolved_at = ?')
    values.push(new Date().toISOString())
  }
  if (status === 'in_progress' || status === 'waiting') {
    fields.push('first_response_at = COALESCE(first_response_at, ?)')
    values.push(new Date().toISOString())
  }
  if (adminName) {
    fields.push('assigned_to = ?')
    values.push(adminName)
  }

  values.push(id)
  await executeInsert(
    `UPDATE pqrs SET ${fields.join(', ')} WHERE id = ?`,
    values
  )
}

// ── Assign PQRS ──

export async function assignPqrs(
  id: string,
  assignedTo: string
): Promise<void> {
  await executeInsert(
    'UPDATE pqrs SET assigned_to = ? WHERE id = ?',
    [assignedTo, id]
  )
}

// ── Add comment ──

export async function addPqrsComment(data: {
  pqrs_id: string
  author_id: string
  author_name: string
  author_role: string
  content: string
  is_internal?: boolean
}): Promise<DbPqrsComment> {
  const id = crypto.randomUUID()
  await executeInsert(
    `INSERT INTO pqrs_comments (id, pqrs_id, author_id, author_name, author_role, content, is_internal)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.pqrs_id,
      data.author_id,
      data.author_name,
      data.author_role,
      data.content,
      data.is_internal ? 1 : 0,
    ]
  )
  return {
    id,
    pqrs_id: data.pqrs_id,
    author_id: data.author_id,
    author_name: data.author_name,
    author_role: data.author_role,
    content: data.content,
    is_internal: data.is_internal || false,
    created_at: new Date().toISOString(),
  }
}

// ── Get comments for PQRS ──

export async function getPqrsComments(pqrsId: string): Promise<DbPqrsComment[]> {
  return queryMany<DbPqrsComment>(
    'SELECT * FROM pqrs_comments WHERE pqrs_id = ? ORDER BY created_at ASC',
    [pqrsId]
  )
}

// ── Stats for admin ──

export interface PqrsStats {
  total: number
  open: number
  in_progress: number
  resolved: number
  closed: number
  waiting: number
  reopened: number
  by_category: Record<string, number>
  by_priority: Record<string, number>
  avg_response_hours: number | null
}

export async function getPqrsStats(buildingId: string): Promise<PqrsStats> {
  const all = await queryMany<DbPqrs>(
    'SELECT * FROM pqrs WHERE building_id = ?',
    [buildingId]
  )

  const total = all.length
  const open = all.filter(p => p.status === 'open').length
  const in_progress = all.filter(p => p.status === 'in_progress').length
  const resolved = all.filter(p => p.status === 'resolved').length
  const closed = all.filter(p => p.status === 'closed').length
  const waiting = all.filter(p => p.status === 'waiting').length
  const reopened = all.filter(p => p.status === 'reopened').length

  const by_category: Record<string, number> = {}
  const by_priority: Record<string, number> = {}
  let totalResponseMs = 0
  let responseCount = 0

  for (const p of all) {
    by_category[p.category] = (by_category[p.category] || 0) + 1
    by_priority[p.priority] = (by_priority[p.priority] || 0) + 1

    if (p.first_response_at) {
      totalResponseMs += new Date(p.first_response_at).getTime() - new Date(p.created_at).getTime()
      responseCount++
    }
  }

  return {
    total,
    open,
    in_progress,
    resolved,
    closed,
    waiting,
    reopened,
    by_category,
    by_priority,
    avg_response_hours: responseCount > 0
      ? Math.round((totalResponseMs / responseCount / 3600000) * 10) / 10
      : null,
  }
}
