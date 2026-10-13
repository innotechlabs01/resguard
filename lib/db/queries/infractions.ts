import 'server-only'
import { queryMany, queryOne, executeInsert } from './helpers'
import type { InValue, PaginatedResult } from './helpers'
import { recordTicketEvent } from './ticket-events'
import { createAlert } from './alerts'

export interface DbInfraction {
  id: string
  building_id: string
  reporter_id: string
  reporter_name: string
  reporter_unit: string | null
  infraction_type: string
  description: string
  location: string | null
  target_unit: string
  status: string
  reply: string | null
  reply_at: string | null
  reply_deadline: string | null
  admin_decision: string | null
  admin_notes: string | null
  decided_by: string | null
  decided_at: string | null
  fine_amount: number | null
  fine_id: string | null
  created_at: string
  updated_at: string
}

export interface DbInfractionEvidence {
  id: string
  infraction_id: string
  type: string
  url: string
  uploaded_by: string
  created_at: string
}

// ── List infractions with optional filters ──

export async function getInfractions(
  buildingId: string,
  filters?: {
    status?: string
    infraction_type?: string
  },
  page?: number,
  pageSize?: number
): Promise<PaginatedResult<DbInfraction>> {
  const conditions: InValue[] = [buildingId]
  const wheres: string[] = ['building_id = ?']

  if (filters?.status) {
    wheres.push('status = ?')
    conditions.push(filters.status)
  }
  if (filters?.infraction_type) {
    wheres.push('infraction_type = ?')
    conditions.push(filters.infraction_type)
  }

  const whereClause = wheres.join(' AND ')

  // Count total matching rows
  const countSql = `SELECT COUNT(*) AS count FROM infraction_reports WHERE ${whereClause}`
  const countResult = await queryMany<{ count: number }>(countSql, conditions)
  const total = countResult[0]?.count ?? 0

  // Fetch paginated rows
  const p = page && page > 0 ? page : 1
  const ps = pageSize && pageSize > 0 ? Math.min(pageSize, 100) : 20
  const offset = (p - 1) * ps

  const sql = `SELECT * FROM infraction_reports WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  const items = await queryMany<DbInfraction>(sql, [...conditions, ps, offset])
  return { items, total, page: p, pageSize: ps }
}

// ── Get infraction by ID ──

export async function getInfractionById(id: string): Promise<DbInfraction | null> {
  return queryOne<DbInfraction>(
    'SELECT * FROM infraction_reports WHERE id = ?',
    [id]
  )
}

// ── Get evidences for an infraction ──

export async function getInfractionEvidences(infractionId: string): Promise<DbInfractionEvidence[]> {
  return queryMany<DbInfractionEvidence>(
    'SELECT * FROM infraction_evidences WHERE infraction_id = ? ORDER BY created_at ASC',
    [infractionId]
  )
}

export async function insertInfractionEvidence(data: {
  infraction_id: string
  type: 'photo' | 'audio' | 'document'
  url: string
  uploaded_by: string
}): Promise<DbInfractionEvidence> {
  const id = crypto.randomUUID()
  await executeInsert(
    `INSERT INTO infraction_evidences (id, infraction_id, type, url, uploaded_by) VALUES (?, ?, ?, ?, ?)`,
    [id, data.infraction_id, data.type, data.url, data.uploaded_by]
  )
  await recordTicketEvent({
    entity_type: 'infraction',
    entity_id: data.infraction_id,
    event_type: 'evidence_uploaded',
    note: data.type,
  })
  const created = await queryOne<DbInfractionEvidence>(
    'SELECT * FROM infraction_evidences WHERE id = ?',
    [id]
  )
  return created!
}

// ── Report an infraction ──

export async function reportInfraction(data: {
  building_id: string
  reporter_id: string
  reporter_name: string
  reporter_unit?: string | null
  infraction_type: string
  description: string
  location?: string | null
  target_unit: string
}): Promise<DbInfraction> {
  const id = crypto.randomUUID()
  await executeInsert(
    `INSERT INTO infraction_reports (id, building_id, reporter_id, reporter_name, reporter_unit, infraction_type, description, location, target_unit)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.building_id,
      data.reporter_id,
      data.reporter_name,
      data.reporter_unit || null,
      data.infraction_type,
      data.description,
      data.location || null,
      data.target_unit,
    ]
  )
  await recordTicketEvent({
    entity_type: 'infraction',
    entity_id: id,
    event_type: 'reported',
    actor_name: data.reporter_name,
    new_value: data.infraction_type,
  })
  try {
    await createAlert({
      building_id: data.building_id,
      type: 'infraction_new',
      title: 'Nueva infracción - Unidad ' + data.target_unit,
      message: data.reporter_name + ': ' + data.description.slice(0, 120),
      priority: 'high',
      read: false,
      action_required: true,
      related_id: id,
    })
  } catch (err) {
    console.error('Failed to create infraction alert:', err)
  }
  const created = await getInfractionById(id)
  return created!
}

// ── Notify infractor (set status to notified + reply_deadline = now + 48h) ──

export async function notifyInfractor(id: string): Promise<void> {
  const infraction = await getInfractionById(id)
  const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
  await executeInsert(
    `UPDATE infraction_reports SET status = ?, reply_deadline = ? WHERE id = ?`,
    ['notified', deadline, id]
  )
  await recordTicketEvent({
    entity_type: 'infraction',
    entity_id: id,
    event_type: 'notified',
    new_value: `reply_deadline: ${deadline}`,
  })
  if (infraction) {
    try {
      const deadlineLabel = new Intl.DateTimeFormat('es-CO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(deadline))
      await createAlert({
        building_id: infraction.building_id,
        type: 'infraction_reply_pending',
        title: 'Réplica pendiente - Unidad ' + infraction.target_unit,
        message: 'Vence el ' + deadlineLabel,
        priority: 'medium',
        read: false,
        action_required: true,
        related_id: id,
      })
    } catch (err) {
      console.error('Failed to create reply pending alert:', err)
    }
  }
}

// ── Submit reply (infractor sends their defense) ──

export async function submitReply(id: string, reply: string): Promise<void> {
  await executeInsert(
    `UPDATE infraction_reports SET status = ?, reply = ?, reply_at = ? WHERE id = ?`,
    ['reply_received', reply, new Date().toISOString(), id]
  )
  await recordTicketEvent({
    entity_type: 'infraction',
    entity_id: id,
    event_type: 'replied',
    note: reply,
  })
}

// ── Admin decides (fine, dismiss, escalate) ──

export async function decideInfraction(
  id: string,
  decision: 'fine' | 'dismiss' | 'escalate',
  notes: string,
  adminName: string,
  fineAmount?: number
): Promise<void> {
  const fields: string[] = ['status = ?', 'admin_decision = ?', 'admin_notes = ?', 'decided_by = ?', 'decided_at = ?']
  const values: InValue[] = [
    decision === 'fine' ? 'fine_issued' : decision === 'dismiss' ? 'dismissed' : 'escalated',
    decision,
    notes,
    adminName,
    new Date().toISOString(),
  ]

  if (decision === 'fine' && fineAmount !== undefined) {
    fields.push('fine_amount = ?')
    values.push(fineAmount)
  }

  values.push(id)
  await executeInsert(
    `UPDATE infraction_reports SET ${fields.join(', ')} WHERE id = ?`,
    values
  )
  await recordTicketEvent({
    entity_type: 'infraction',
    entity_id: id,
    event_type: 'decided',
    actor_name: adminName,
    new_value: decision,
    note: notes,
  })
}

// ── Stats for admin ──

export interface InfractionStats {
  total: number
  reported: number
  notified: number
  reply_pending: number
  reply_received: number
  fine_issued: number
  dismissed: number
  escalated: number
  by_type: Record<string, number>
  total_fines_amount: number
}

export async function getInfractionStats(buildingId: string): Promise<InfractionStats> {
  const all = await queryMany<DbInfraction>(
    'SELECT * FROM infraction_reports WHERE building_id = ?',
    [buildingId]
  )

  const by_type: Record<string, number> = {}
  let totalFines = 0

  for (const i of all) {
    by_type[i.infraction_type] = (by_type[i.infraction_type] || 0) + 1
    if (i.fine_amount) totalFines += Number(i.fine_amount)
  }

  return {
    total: all.length,
    reported: all.filter(i => i.status === 'reported').length,
    notified: all.filter(i => i.status === 'notified').length,
    reply_pending: all.filter(i => i.status === 'reply_pending').length,
    reply_received: all.filter(i => i.status === 'reply_received').length,
    fine_issued: all.filter(i => i.status === 'fine_issued').length,
    dismissed: all.filter(i => i.status === 'dismissed').length,
    escalated: all.filter(i => i.status === 'escalated').length,
    by_type,
    total_fines_amount: totalFines,
  }
}
