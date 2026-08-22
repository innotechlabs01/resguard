import 'server-only'
import { queryMany, queryOne, executeInsert } from './helpers'
import type { InValue } from './helpers'

export interface DbChatThread {
  id: string
  building_id: string
  unit_number: string
  thread_type: 'vigilante' | 'admin' | 'ai'
  subject: string | null
  last_message_at: string | null
  last_message_preview: string | null
  created_at: string
}

export interface DbChatMessage {
  id: string
  thread_id: string
  sender_id: string
  sender_name: string
  sender_role: string
  content: string
  is_read: boolean
  created_at: string
}

// ── Get threads by building (vigilante/admin view: all threads) ──

export async function getThreadsByBuilding(buildingId: string): Promise<DbChatThread[]> {
  return queryMany<DbChatThread>(
    'SELECT * FROM chat_threads WHERE building_id = ? ORDER BY last_message_at DESC NULLS LAST',
    [buildingId]
  )
}

// ── Get threads by unit (resident view: their unit only) ──

export async function getThreadsByUnit(buildingId: string, unitNumber: string): Promise<DbChatThread[]> {
  return queryMany<DbChatThread>(
    'SELECT * FROM chat_threads WHERE building_id = ? AND unit_number = ? ORDER BY last_message_at DESC NULLS LAST',
    [buildingId, unitNumber]
  )
}

// ── Get or create thread ──

export async function getOrCreateThread(
  buildingId: string,
  unitNumber: string,
  threadType: 'vigilante' | 'admin' | 'ai',
  subject?: string
): Promise<DbChatThread> {
  const existing = await queryOne<DbChatThread>(
    'SELECT * FROM chat_threads WHERE building_id = ? AND unit_number = ? AND thread_type = ?',
    [buildingId, unitNumber, threadType]
  )

  if (existing) return existing

  const id = crypto.randomUUID()
  await executeInsert(
    `INSERT INTO chat_threads (id, building_id, unit_number, thread_type, subject)
     VALUES (?, ?, ?, ?, ?)`,
    [id, buildingId, unitNumber, threadType, subject || null]
  )

  return (await queryOne<DbChatThread>(
    'SELECT * FROM chat_threads WHERE id = ?',
    [id]
  ))!
}

// ── Get messages for a thread ──

export async function getMessages(threadId: string, limit = 50): Promise<DbChatMessage[]> {
  return queryMany<DbChatMessage>(
    'SELECT * FROM chat_thread_messages WHERE thread_id = ? ORDER BY created_at ASC LIMIT ?',
    [threadId, limit]
  )
}

// ── Send a message ──

export async function sendMessage(data: {
  threadId: string
  senderId: string
  senderName: string
  senderRole: string
  content: string
}): Promise<DbChatMessage> {
  const id = crypto.randomUUID()
  await executeInsert(
    `INSERT INTO chat_thread_messages (id, thread_id, sender_id, sender_name, sender_role, content)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, data.threadId, data.senderId, data.senderName, data.senderRole, data.content]
  )

  // Update thread metadata
  const preview = data.content.length > 255 ? data.content.substring(0, 255) : data.content
  await executeInsert(
    `UPDATE chat_threads SET last_message_at = ?, last_message_preview = ? WHERE id = ?`,
    [new Date().toISOString(), preview, data.threadId]
  )

  return (await queryOne<DbChatMessage>(
    'SELECT * FROM chat_thread_messages WHERE id = ?',
    [id]
  ))!
}

// ── Mark messages as read ──

export async function markAsRead(threadId: string, userId: string): Promise<void> {
  await executeInsert(
    `UPDATE chat_thread_messages SET is_read = true WHERE thread_id = ? AND sender_id != ? AND is_read = false`,
    [threadId, userId]
  )
}

// ── Get unread count for a user ──

export async function getUnreadCount(buildingId: string, userId: string): Promise<number> {
  const result = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM chat_thread_messages m
     JOIN chat_threads t ON m.thread_id = t.id
     WHERE t.building_id = ? AND m.sender_id != ? AND m.is_read = false`,
    [buildingId, userId]
  )
  return result?.count || 0
}
