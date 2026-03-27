import 'server-only'
import { queryMany, queryOne, executeInsert } from './helpers'
import type { InValue } from '@libsql/client'

export interface DbShiftReport {
  id: string
  building_id: string
  guard_name: string
  shift_start: string
  shift_end: string | null
  incidents: string | null
  notes: string | null
  audio_transcription: string | null
  created_at: string
}

export async function getShiftReportById(id: string): Promise<DbShiftReport | null> {
  return queryOne<DbShiftReport>(
    'SELECT * FROM shift_reports WHERE id = ?',
    [id],
    async (client) => {
      const { data, error } = await client!.from('shift_reports').select('*').eq('id', id).single()
      return { data: data as DbShiftReport | null, error }
    }
  )
}

export async function getShiftReports(buildingId: string): Promise<DbShiftReport[]> {
  return queryMany<DbShiftReport>(
    'SELECT * FROM shift_reports WHERE building_id = ? ORDER BY shift_start DESC',
    [buildingId],
    async (client) => {
      const { data, error } = await client!.from('shift_reports').select('*').eq('building_id', buildingId).order('shift_start', { ascending: false })
      return { data: data as DbShiftReport[] | null, error }
    }
  )
}

export async function createShiftReport(report: Omit<DbShiftReport, 'id' | 'created_at'> & { id?: string }): Promise<void> {
  const id = report.id ?? crypto.randomUUID()
  await executeInsert(
    'INSERT INTO shift_reports (id, building_id, guard_name, shift_start, shift_end, incidents, notes, audio_transcription) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, report.building_id, report.guard_name, report.shift_start, report.shift_end, report.incidents, report.notes, report.audio_transcription] as InValue[],
    async (client) => {
      const { error } = await client!.from('shift_reports').insert({
        id,
        building_id: report.building_id,
        guard_name: report.guard_name,
        shift_start: report.shift_start,
        shift_end: report.shift_end,
        incidents: report.incidents,
        notes: report.notes,
        audio_transcription: report.audio_transcription,
      })
      return { error }
    }
  )
}

export async function updateShiftReport(id: string, updates: Partial<DbShiftReport>): Promise<void> {
  const fields: string[] = []
  const values: InValue[] = []
  if (updates.shift_end !== undefined) { fields.push('shift_end = ?'); values.push(updates.shift_end) }
  if (updates.incidents !== undefined) { fields.push('incidents = ?'); values.push(updates.incidents) }
  if (updates.notes !== undefined) { fields.push('notes = ?'); values.push(updates.notes) }
  if (updates.audio_transcription !== undefined) { fields.push('audio_transcription = ?'); values.push(updates.audio_transcription) }
  if (fields.length === 0) return
  values.push(id)
  await executeInsert(
    `UPDATE shift_reports SET ${fields.join(', ')} WHERE id = ?`,
    values,
    async (client) => {
      const supabaseUpdates: Record<string, unknown> = {}
      if (updates.shift_end !== undefined) supabaseUpdates.shift_end = updates.shift_end
      if (updates.incidents !== undefined) supabaseUpdates.incidents = updates.incidents
      if (updates.notes !== undefined) supabaseUpdates.notes = updates.notes
      if (updates.audio_transcription !== undefined) supabaseUpdates.audio_transcription = updates.audio_transcription
      const { error } = await client!.from('shift_reports').update(supabaseUpdates).eq('id', id)
      return { error }
    }
  )
}

export async function deleteShiftReport(id: string): Promise<void> {
  await executeInsert(
    'DELETE FROM shift_reports WHERE id = ?',
    [id],
    async (client) => {
      const { error } = await client!.from('shift_reports').delete().eq('id', id)
      return { error }
    }
  )
}
