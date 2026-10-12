import 'server-only'
import { queryMany, queryOne, executeInsert } from './helpers'

export interface DbUser {
  id: string
  email: string
  name: string
  role: string
  building_id: string | null
}

function mapUser(row: Record<string, unknown>): DbUser {
  return {
    id: row.id as string,
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

export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const row = await queryOne<Record<string, unknown>>(
    'SELECT * FROM users WHERE email = ?',
    [email]
  )
  return row ? mapUser(row) : null
}

export async function getUsers(buildingId?: string | null): Promise<DbUser[]> {
  if (buildingId) {
    const rows = await queryMany<Record<string, unknown>>(
      'SELECT * FROM users WHERE building_id = ? ORDER BY created_at DESC',
      [buildingId]
    )
    return rows.map(mapUser)
  }
  const rows = await queryMany<Record<string, unknown>>(
    'SELECT * FROM users ORDER BY created_at DESC',
    []
  )
  return rows.map(mapUser)
}

export async function createUser(user: {
  id: string
  email: string
  name: string
  role: string
  building_id?: string | null
}): Promise<void> {
  await executeInsert(
    'INSERT INTO users (id, email, name, role, building_id) VALUES (?, ?, ?, ?, ?)',
    [user.id, user.email, user.name, user.role, user.building_id ?? null]
  )
}

export async function updateUser(id: string, updates: Partial<Record<string, unknown>>): Promise<void> {
  const fields: string[] = []
  const values: (string | number | null)[] = []

  if (updates.name !== undefined) { fields.push('name = ?'); values.push(String(updates.name)) }
  if (updates.role !== undefined) { fields.push('role = ?'); values.push(String(updates.role)) }
  if (updates.building_id !== undefined) { fields.push('building_id = ?'); values.push((updates.building_id ?? null) as string | null) }
  if (updates.status !== undefined) { fields.push('status = ?'); values.push(String(updates.status)) }
  if (updates.unit !== undefined) { fields.push('unit = ?'); values.push(String(updates.unit)) }
  if (updates.phone !== undefined) { fields.push('phone = ?'); values.push(String(updates.phone)) }
  if (updates.profile_picture !== undefined) { fields.push('profile_picture = ?'); values.push((updates.profile_picture ?? null) as string | null) }

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
