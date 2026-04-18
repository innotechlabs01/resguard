import 'server-only'
import { queryMany, queryOne, executeInsert } from './helpers'
import type { InValue } from '@libsql/client'

export interface DbChatMessage {
  id: string
  building_id: string
  user_id: string | null
  role: string
  content: string
  timestamp: string
  created_at: string
}

export async function getChatMessageById(id: string): Promise<DbChatMessage | null> {
  return queryOne<DbChatMessage>(
    'SELECT * FROM chat_messages WHERE id = ?',
    [id]
  )
}

export async function getChatMessages(buildingId: string, limit = 50): Promise<DbChatMessage[]> {
  return queryMany<DbChatMessage>(
    'SELECT * FROM chat_messages WHERE building_id = ? ORDER BY timestamp DESC LIMIT ?',
    [buildingId, limit]
  )
}

export async function createChatMessage(message: Omit<DbChatMessage, 'id' | 'created_at'> & { id?: string }): Promise<void> {
  const id = message.id ?? crypto.randomUUID()
  await executeInsert(
    'INSERT INTO chat_messages (id, building_id, user_id, role, content) VALUES (?, ?, ?, ?, ?)',
    [id, message.building_id, message.user_id, message.role, message.content] as InValue[]
  )
}

export async function deleteChatMessage(id: string): Promise<void> {
  await executeInsert(
    'DELETE FROM chat_messages WHERE id = ?',
    [id]
  )
}
