import 'server-only'
import { queryMany, queryOne, executeInsert } from './helpers'

export interface DbUser {
  id: string
  clerk_user_id: string | null
  email: string
  name: string
  role: string
  building_id: string | null
}

function mapUser(row: Record<string, unknown>): DbUser {
  return {
    id: row.id as string,
    clerk_user_id: (row.clerk_user_id ?? null) as string | null,
    email: row.email as string,
    name: row.name as string,
    role: row.role as string,
    building_id: (row.building_id ?? null) as string | null,
  }
}

export async function getUserById(id: string): Promise<DbUser | null> {
  const row = await queryOne<Record<string, unknown>>(
    'SELECT * FROM users WHERE id = ?',
    [id]
  )
  return row ? mapUser(row) : null
}

export async function getUserByClerkId(clerkUserId: string): Promise<DbUser | null> {
  const row = await queryOne<Record<string, unknown>>(
    'SELECT * FROM users WHERE clerk_user_id = ?',
    [clerkUserId]
  )
  return row ? mapUser(row) : null
}

export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const row = await queryOne<Record<string, unknown>>(
    'SELECT * FROM users WHERE email = ?',
    [email]
  )
  return row ? mapUser(row) : null
}

export async function getUsers(): Promise<DbUser[]> {
  const rows = await queryMany<Record<string, unknown>>(
    'SELECT * FROM users ORDER BY created_at DESC',
    []
  )
  return rows.map(mapUser)
}

export async function createUser(user: {
  clerk_user_id: string | null
  email: string
  name: string
  role: string
  building_id?: string | null
}): Promise<void> {
  const id = crypto.randomUUID()
  await executeInsert(
    'INSERT INTO users (id, clerk_user_id, email, name, role, building_id) VALUES (?, ?, ?, ?, ?, ?)',
    [id, user.clerk_user_id, user.email, user.name, user.role, user.building_id ?? null]
  )
}

export async function updateUser(id: string, updates: Partial<Pick<DbUser, 'name' | 'role' | 'building_id' | 'clerk_user_id'>>): Promise<void> {
  const fields: string[] = []
  const values: (string | number | null)[] = []

  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name) }
  if (updates.role !== undefined) { fields.push('role = ?'); values.push(updates.role) }
  if (updates.building_id !== undefined) { fields.push('building_id = ?'); values.push(updates.building_id) }
  if (updates.clerk_user_id !== undefined) { fields.push('clerk_user_id = ?'); values.push(updates.clerk_user_id) }

  if (fields.length === 0) return

  values.push(id)
  await executeInsert(
    `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
    values
  )
}

export async function deleteUser(id: string): Promise<void> {
  await executeInsert(
    'DELETE FROM users WHERE id = ?',
    [id]
  )
}
