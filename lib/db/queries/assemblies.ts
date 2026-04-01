import 'server-only'
import { queryMany, queryOne, executeInsert } from './helpers'
import type { InValue } from '@libsql/client'

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
    [buildingId],
    async (client: any) => {
      const { data, error } = await client.from('assemblies').select('*').eq('building_id', buildingId).order('date', { ascending: false })
      return { data: data as DbAssembly[] | null, error }
    }
  )
}

export async function getAssemblyById(id: string): Promise<DbAssembly | null> {
  return queryOne<DbAssembly>(
    'SELECT * FROM assemblies WHERE id = ?',
    [id],
    async (client: any) => {
      const { data, error } = await client.from('assemblies').select('*').eq('id', id).single()
      return { data: data as DbAssembly | null, error }
    }
  )
}

export async function createAssembly(assembly: { building_id: string; title: string; description: string; date: string; time: string; location: string; status?: string; created_by: string }): Promise<string> {
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  
  await executeInsert(
    'INSERT INTO assemblies (id, building_id, title, description, date, time, location, status, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, assembly.building_id, assembly.title, assembly.description, assembly.date, assembly.time, assembly.location, assembly.status ?? 'scheduled', createdAt, assembly.created_by] as InValue[],
    async (client: any) => {
      const { error } = await client.from('assemblies').insert({
        id,
        building_id: assembly.building_id,
        title: assembly.title,
        description: assembly.description,
        date: assembly.date,
        time: assembly.time,
        location: assembly.location,
        status: assembly.status ?? 'scheduled',
        created_at: createdAt,
        created_by: assembly.created_by,
      })
      return { error }
    }
  )
  
  return id
}

export async function updateAssemblyStatus(id: string, status: string): Promise<void> {
  await executeInsert(
    'UPDATE assemblies SET status = ? WHERE id = ?',
    [status, id] as InValue[],
    async (client: any) => {
      const { error } = await client.from('assemblies').update({ status }).eq('id', id)
      return { error }
    }
  )
}

export async function getAssemblyVotes(assemblyId: string): Promise<DbAssemblyVote[]> {
  return queryMany<DbAssemblyVote>(
    'SELECT * FROM assembly_votes WHERE assembly_id = ? ORDER BY created_at DESC',
    [assemblyId],
    async (client: any) => {
      const { data, error } = await client.from('assembly_votes').select('*').eq('assembly_id', assemblyId).order('created_at', { ascending: false })
      return { data: data as DbAssemblyVote[] | null, error }
    }
  )
}

export async function getVoteById(id: string): Promise<DbAssemblyVote | null> {
  return queryOne<DbAssemblyVote>(
    'SELECT * FROM assembly_votes WHERE id = ?',
    [id],
    async (client: any) => {
      const { data, error } = await client.from('assembly_votes').select('*').eq('id', id).single()
      return { data: data as DbAssemblyVote | null, error }
    }
  )
}

export async function createAssemblyVote(vote: { assembly_id: string; title: string; description: string; options: string; status?: string; required_quorum?: number; created_by: string }): Promise<string> {
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  
  await executeInsert(
    'INSERT INTO assembly_votes (id, assembly_id, title, description, options, status, required_quorum, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, vote.assembly_id, vote.title, vote.description, vote.options, vote.status ?? 'pending', vote.required_quorum ?? null, createdAt, vote.created_by] as InValue[],
    async (client: any) => {
      const { error } = await client.from('assembly_votes').insert({
        id,
        assembly_id: vote.assembly_id,
        title: vote.title,
        description: vote.description,
        options: vote.options,
        status: vote.status ?? 'pending',
        required_quorum: vote.required_quorum,
        created_at: createdAt,
        created_by: vote.created_by,
      })
      return { error }
    }
  )
  
  return id
}

export async function updateVoteStatus(id: string, status: string): Promise<void> {
  await executeInsert(
    'UPDATE assembly_votes SET status = ? WHERE id = ?',
    [status, id] as InValue[],
    async (client: any) => {
      const { error } = await client.from('assembly_votes').update({ status }).eq('id', id)
      return { error }
    }
  )
}

export async function castVote(voteResponse: { vote_id: string; user_id: string; user_name: string; unit: string; option_id: string }): Promise<string> {
  const id = crypto.randomUUID()
  const votedAt = new Date().toISOString()
  
  await executeInsert(
    'INSERT INTO assembly_vote_responses (id, vote_id, user_id, user_name, unit, option_id, voted_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, voteResponse.vote_id, voteResponse.user_id, voteResponse.user_name, voteResponse.unit, voteResponse.option_id, votedAt] as InValue[],
    async (client: any) => {
      const { error } = await client.from('assembly_vote_responses').insert({
        id,
        vote_id: voteResponse.vote_id,
        user_id: voteResponse.user_id,
        user_name: voteResponse.user_name,
        unit: voteResponse.unit,
        option_id: voteResponse.option_id,
        voted_at: votedAt,
      })
      return { error }
    }
  )
  
  return id
}

export async function getVoteResponses(voteId: string): Promise<DbVoteResponse[]> {
  return queryMany<DbVoteResponse>(
    'SELECT * FROM assembly_vote_responses WHERE vote_id = ? ORDER BY voted_at DESC',
    [voteId],
    async (client: any) => {
      const { data, error } = await client.from('assembly_vote_responses').select('*').eq('vote_id', voteId).order('voted_at', { ascending: false })
      return { data: data as DbVoteResponse[] | null, error }
    }
  )
}

export async function hasUserVoted(voteId: string, userId: string): Promise<boolean> {
  const result = await queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM assembly_vote_responses WHERE vote_id = ? AND user_id = ?',
    [voteId, userId],
    async (client: any) => {
      const { data, error } = await client.from('assembly_vote_responses').select('id', { count: 'exact' }).eq('vote_id', voteId).eq('user_id', userId)
      return { data: data ? { count: data.length } : null, error }
    }
  )
  return (result?.count ?? 0) > 0
}