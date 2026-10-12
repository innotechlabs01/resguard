import 'server-only'
import { queryMany, executeInsert } from './helpers'

export type TicketEntityType = 'pqrs' | 'infraction'

export interface DbTicketEvent {
  id: string
  entity_type: TicketEntityType
  entity_id: string
  event_type: string
  actor_name: string | null
  old_value: string | null
  new_value: string | null
  note: string | null
  created_at: string
}

interface RecordTicketEventInput {
  entity_type: TicketEntityType
  entity_id: string
  event_type: string
  actor_name?: string | null
  old_value?: string | null
  new_value?: string | null
  note?: string | null
}

// ── Record a ticket event ──

export async function recordTicketEvent(data: RecordTicketEventInput): Promise<void> {
  await executeInsert(
    `INSERT INTO ticket_events (id, entity_type, entity_id, event_type, actor_name, old_value, new_value, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      crypto.randomUUID(),
      data.entity_type,
      data.entity_id,
      data.event_type,
      data.actor_name ?? null,
      data.old_value ?? null,
      data.new_value ?? null,
      data.note ?? null,
      new Date().toISOString(),
    ]
  )
}

// ── Get ticket events for an entity (oldest first) ──

export async function getTicketEvents(
  entityType: TicketEntityType,
  entityId: string
): Promise<DbTicketEvent[]> {
  return queryMany<DbTicketEvent>(
    'SELECT * FROM ticket_events WHERE entity_type = ? AND entity_id = ? ORDER BY created_at ASC',
    [entityType, entityId]
  )
}
