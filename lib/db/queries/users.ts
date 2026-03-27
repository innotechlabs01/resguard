import 'server-only'
import { queryMany, queryOne } from './helpers'
import type { InValue } from '@libsql/client'

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
    clerk_user_id: (row.clerk_user_id ?? row.clerkUserId) as string | null,
    email: row.email as string,
    name: row.name as string,
    role: row.role as string,
    building_id: (row.building_id ?? row.buildingId) as string | null,
  }
}

export async function getUserById(id: string): Promise<DbUser | null> {
  const row = await queryOne<Record<string, unknown>>(
    'SELECT * FROM users WHERE id = ?',
    [id],
    async (client) => {
      const { data, error } = await client!.from('users').select('*').eq('id', id).single()
      return { data: data as Record<string, unknown> | null, error }
    }
  )
  return row ? mapUser(row) : null
}

export async function getUserByClerkId(clerkUserId: string): Promise<DbUser | null> {
  const row = await queryOne<Record<string, unknown>>(
    'SELECT * FROM users WHERE clerk_user_id = ?',
    [clerkUserId],
    async (client) => {
      const { data, error } = await client!.from('users').select('*').eq('clerk_user_id', clerkUserId).single()
      return { data: data as Record<string, unknown> | null, error }
    }
  )
  return row ? mapUser(row) : null
}

export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const row = await queryOne<Record<string, unknown>>(
    'SELECT * FROM users WHERE email = ?',
    [email],
    async (client) => {
      const { data, error } = await client!.from('users').select('*').eq('email', email).single()
      return { data: data as Record<string, unknown> | null, error }
    }
  )
  return row ? mapUser(row) : null
}

export async function getUsers(): Promise<DbUser[]> {
  const rows = await queryMany<Record<string, unknown>>(
    'SELECT * FROM users ORDER BY created_at DESC',
    [],
    async (client) => {
      const { data, error } = await client!.from('users').select('*').order('created_at', { ascending: false })
      return { data: data as Record<string, unknown>[] | null, error }
    }
  )
  return rows.map(mapUser)
}

export async function createUser(user: { id?: string; clerk_user_id: string; email: string; name: string; role: string; building_id?: string | null }): Promise<void> {
  const { executeInsert } = await import('./helpers')
  const id = user.id ?? crypto.randomUUID()
  await executeInsert(
    'INSERT INTO users (id, clerk_user_id, email, name, role, building_id) VALUES (?, ?, ?, ?, ?, ?)',
    [id, user.clerk_user_id, user.email, user.name, user.role, user.building_id ?? null] as InValue[],
    async (client) => {
      const { error } = await client!.from('users').insert({
        id,
        clerk_user_id: user.clerk_user_id,
        email: user.email,
        name: user.name,
        role: user.role,
        building_id: user.building_id ?? null,
      })
      return { error }
    }
  )
}

export async function updateUser(id: string, updates: Partial<Pick<DbUser, 'name' | 'role' | 'building_id' | 'clerk_user_id'>>): Promise<void> {
  const { executeInsert } = await import('./helpers')
  const fields: string[] = []
  const values: InValue[] = []

  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name) }
  if (updates.role !== undefined) { fields.push('role = ?'); values.push(updates.role) }
  if (updates.building_id !== undefined) { fields.push('building_id = ?'); values.push(updates.building_id) }
  if (updates.clerk_user_id !== undefined) { fields.push('clerk_user_id = ?'); values.push(updates.clerk_user_id) }

  if (fields.length === 0) return

  values.push(id)
  await executeInsert(
    `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
    values,
    async (client) => {
      const supabaseUpdates: Record<string, unknown> = {}
      if (updates.name !== undefined) supabaseUpdates.name = updates.name
      if (updates.role !== undefined) supabaseUpdates.role = updates.role
      if (updates.building_id !== undefined) supabaseUpdates.building_id = updates.building_id
      if (updates.clerk_user_id !== undefined) supabaseUpdates.clerk_user_id = updates.clerk_user_id
      const { error } = await client!.from('users').update(supabaseUpdates).eq('id', id)
      return { error }
    }
  )
}

export async function deleteUser(id: string): Promise<void> {
  const { executeInsert } = await import('./helpers')
  await executeInsert(
    'DELETE FROM users WHERE id = ?',
    [id],
    async (client) => {
      const { error } = await client!.from('users').delete().eq('id', id)
      return { error }
    }
  )
}
