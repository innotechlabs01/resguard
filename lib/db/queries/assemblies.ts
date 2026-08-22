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

export async function getAssemblyVotes(assemblyId: string): Promise<DbAssemblyVote[]> {
  return queryMany<DbAssemblyVote>(
    'SELECT * FROM assembly_votes WHERE assembly_id = ? ORDER BY created_at DESC',
    [assemblyId]
  )
}

export async function getVoteById(id: string): Promise<DbAssemblyVote | null> {
  return queryOne<DbAssemblyVote>(
    'SELECT * FROM assembly_votes WHERE id = ?',
    [id]
  )
}

export async function createAssemblyVote(vote: { assembly_id: string; title: string; description: string; options: string; status?: string; required_quorum?: number; created_by: string }): Promise<string> {
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  
  await executeInsert(
    'INSERT INTO assembly_votes (assembly_id, title, description, options, status, required_quorum, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [vote.assembly_id, vote.title, vote.description, vote.options, vote.status ?? 'pending', vote.required_quorum ?? null, createdAt, vote.created_by] as InValue[]
  )
  
  return id
}

export async function updateVoteStatus(id: string, status: string): Promise<void> {
  await executeInsert(
    'UPDATE assembly_votes SET status = ? WHERE id = ?',
    [status, id] as InValue[]
  )
}

export async function castVote(voteResponse: { vote_id: string; user_id: string; user_name: string; unit: string; option_id: string }): Promise<string> {
  const id = crypto.randomUUID()
  const votedAt = new Date().toISOString()
  
  await executeInsert(
    'INSERT INTO assembly_vote_responses (vote_id, user_id, user_name, unit, option_id, voted_at) VALUES (?, ?, ?, ?, ?, ?)',
    [voteResponse.vote_id, voteResponse.user_id, voteResponse.user_name, voteResponse.unit, voteResponse.option_id, votedAt] as InValue[]
  )
  
  return id
}

export async function getVoteResponses(voteId: string): Promise<DbVoteResponse[]> {
  return queryMany<DbVoteResponse>(
    'SELECT * FROM assembly_vote_responses WHERE vote_id = ? ORDER BY voted_at DESC',
    [voteId]
  )
}

export async function hasUserVoted(voteId: string, userId: string): Promise<boolean> {
  const result = await queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM assembly_vote_responses WHERE vote_id = ? AND user_id = ?',
    [voteId, userId]
  )
  return (result?.count ?? 0) > 0
}
