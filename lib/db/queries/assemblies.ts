import 'server-only'
import { queryMany, queryOne, executeInsert } from './helpers'
import type { InValue } from './helpers'

export interface DbAssembly {
  id: string
  building_id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  status: string
  created_at: string
  created_by: string
}

export interface DbAssemblyVote {
  id: string
  assembly_id: string
  title: string
  description: string
  options: string
  status: string
  required_quorum: number | null
  created_at: string
  created_by: string
}

export interface DbVoteResponse {
  id: string
  vote_id: string
  user_id: string
  user_name: string
  unit: string
  option_id: string
  voted_at: string
}

export async function getAssemblies(buildingId: string): Promise<DbAssembly[]> {
  return queryMany<DbAssembly>(
    'SELECT * FROM assemblies WHERE building_id = ? ORDER BY date DESC',
    [buildingId]
  )
}

export async function getAssemblyById(id: string): Promise<DbAssembly | null> {
  return queryOne<DbAssembly>(
    'SELECT * FROM assemblies WHERE id = ?',
    [id]
  )
}

/**
 * Resolves the building_id that owns an agenda item (via its assembly).
 * Used by API routes to enforce building isolation on vote operations.
 */
export async function getAgendaItemBuildingId(agendaItemId: string): Promise<string | null> {
  const row = await queryOne<{ building_id: string }>(
    `SELECT a.building_id
     FROM agenda_items ai
     JOIN assemblies a ON a.id = ai.assembly_id
     WHERE ai.id = ?`,
    [agendaItemId]
  )
  return row ? row.building_id : null
}

export interface DbAgendaItem {
  id: string
  assembly_id: string
  title: string
  description: string | null
  vote_type: string
  options: { id: string; label: string }[]
  created_at: string
}

export interface DbVoteRow {
  id: string
  user_id: string
  option_id: string | null
  created_at: string
}

export async function getAgendaItems(assemblyId: string): Promise<DbAgendaItem[]> {
  return queryMany<DbAgendaItem>(
    'SELECT * FROM agenda_items WHERE assembly_id = ? ORDER BY created_at ASC',
    [assemblyId]
  )
}

export async function createAgendaItem(item: {
  assembly_id: string
  title: string
  description?: string
  vote_type: string
  options: { id: string; label: string }[]
}): Promise<DbAgendaItem> {
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()

  await executeInsert(
    'INSERT INTO agenda_items (id, assembly_id, title, description, vote_type, options, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, item.assembly_id, item.title, item.description ?? '', item.vote_type, item.options as unknown as InValue, createdAt] as InValue[]
  )

  return { id, assembly_id: item.assembly_id, title: item.title, description: item.description ?? null, vote_type: item.vote_type, options: item.options, created_at: createdAt }
}

export async function getVotesForItem(agendaItemId: string): Promise<DbVoteRow[]> {
  return queryMany<DbVoteRow>(
    'SELECT id, user_id, option_id, created_at FROM votes WHERE agenda_item_id = ?',
    [agendaItemId]
  )
}

export async function hasUserVotedOnItem(agendaItemId: string, userId: string): Promise<boolean> {
  const result = await queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM votes WHERE agenda_item_id = ? AND user_id = ?',
    [agendaItemId, userId]
  )
  return (result?.count ?? 0) > 0
}

export async function insertVote(vote: {
  agenda_item_id: string
  user_id: string
  encrypted_vote: string
  vote_hash: string
  option_id: string
}): Promise<void> {
  await executeInsert(
    'INSERT INTO votes (id, agenda_item_id, user_id, encrypted_vote, vote_hash, option_id) VALUES (?, ?, ?, ?, ?, ?)',
    [crypto.randomUUID(), vote.agenda_item_id, vote.user_id, vote.encrypted_vote, vote.vote_hash, vote.option_id] as InValue[]
  )
}

export async function createAssembly(assembly: { building_id: string; title: string; description: string; date: string; time: string; location: string; status?: string; created_by: string }): Promise<string> {
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  
  await executeInsert(
    'INSERT INTO assemblies (building_id, title, description, date, time, location, status, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [assembly.building_id, assembly.title, assembly.description, assembly.date, assembly.time, assembly.location, assembly.status ?? 'scheduled', createdAt, assembly.created_by] as InValue[]
  )
  
  return id
}

export async function updateAssemblyStatus(id: string, status: string): Promise<void> {
  await executeInsert(
    'UPDATE assemblies SET status = ? WHERE id = ?',
    [status, id] as InValue[]
  )
}

/** @deprecated Legacy assembly_votes model. Use getAgendaItems instead. */
export async function getAssemblyVotes(assemblyId: string): Promise<DbAssemblyVote[]> {
  return queryMany<DbAssemblyVote>(
    'SELECT * FROM assembly_votes WHERE assembly_id = ? ORDER BY created_at DESC',
    [assemblyId]
  )
}

/** @deprecated Legacy assembly_votes model. */
export async function getVoteById(id: string): Promise<DbAssemblyVote | null> {
  return queryOne<DbAssemblyVote>(
    'SELECT * FROM assembly_votes WHERE id = ?',
    [id]
  )
}

/** @deprecated Legacy assembly_votes model. Use createAgendaItem instead. */
export async function createAssemblyVote(vote: { assembly_id: string; title: string; description: string; options: string; status?: string; required_quorum?: number; created_by: string }): Promise<string> {
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  
  await executeInsert(
    'INSERT INTO assembly_votes (assembly_id, title, description, options, status, required_quorum, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [vote.assembly_id, vote.title, vote.description, vote.options, vote.status ?? 'pending', vote.required_quorum ?? null, createdAt, vote.created_by] as InValue[]
  )
  
  return id
}

/** @deprecated Legacy assembly_votes model. */
export async function updateVoteStatus(id: string, status: string): Promise<void> {
  await executeInsert(
    'UPDATE assembly_votes SET status = ? WHERE id = ?',
    [status, id] as InValue[]
  )
}

/** @deprecated Legacy assembly_votes model. Use insertVote instead. */
export async function castVote(voteResponse: { vote_id: string; user_id: string; user_name: string; unit: string; option_id: string }): Promise<string> {
  const id = crypto.randomUUID()
  const votedAt = new Date().toISOString()
  
  await executeInsert(
    'INSERT INTO assembly_vote_responses (vote_id, user_id, user_name, unit, option_id, voted_at) VALUES (?, ?, ?, ?, ?, ?)',
    [voteResponse.vote_id, voteResponse.user_id, voteResponse.user_name, voteResponse.unit, voteResponse.option_id, votedAt] as InValue[]
  )
  
  return id
}

/** @deprecated Legacy assembly_votes model. Use getVotesForItem instead. */
export async function getVoteResponses(voteId: string): Promise<DbVoteResponse[]> {
  return queryMany<DbVoteResponse>(
    'SELECT * FROM assembly_vote_responses WHERE vote_id = ? ORDER BY voted_at DESC',
    [voteId]
  )
}

/** @deprecated Legacy assembly_votes model. Use hasUserVotedOnItem instead. */
export async function hasUserVoted(voteId: string, userId: string): Promise<boolean> {
  const result = await queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM assembly_vote_responses WHERE vote_id = ? AND user_id = ?',
    [voteId, userId]
  )
  return (result?.count ?? 0) > 0
}
