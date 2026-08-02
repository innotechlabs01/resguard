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
    [id]
  )
}

export async function getShiftReports(buildingId: string): Promise<DbShiftReport[]> {
  return queryMany<DbShiftReport>(
    'SELECT * FROM shift_reports WHERE building_id = ? ORDER BY shift_start DESC',
    [buildingId]
  )
}

export async function createShiftReport(report: Omit<DbShiftReport, 'id' | 'created_at'> & { id?: string }): Promise<void> {
  const id = report.id ?? crypto.randomUUID()
  await executeInsert(
    'INSERT INTO shift_reports (id, building_id, guard_name, shift_start, shift_end, incidents, notes, audio_transcription) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, report.building_id, report.guard_name, report.shift_start, report.shift_end, report.incidents, report.notes, report.audio_transcription] as InValue[]
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
    values
  )
}

export async function deleteShiftReport(id: string): Promise<void> {
  await executeInsert(
    'DELETE FROM shift_reports WHERE id = ?',
    [id]
  )
}
