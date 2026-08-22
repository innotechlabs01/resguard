import 'server-only'
import { queryMany, queryOne, executeInsert } from './helpers'
import type { InValue } from './helpers'

export interface DbOnboardingChecklist {
  id: string
  building_id: string
  user_id: string
  user_name: string
  user_unit: string | null
  status: string
  signed_regulation: boolean
  received_keys: boolean
  met_vigilante: boolean
  met_admin: boolean
  parking_assigned: boolean
  wifi_configured: boolean
  emergency_numbers: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
}

// ── Get checklists by building ──

export async function getOnboardingByBuilding(buildingId: string): Promise<DbOnboardingChecklist[]> {
  return queryMany<DbOnboardingChecklist>(
    'SELECT * FROM onboarding_checklists WHERE building_id = ? ORDER BY created_at DESC',
    [buildingId]
  )
}

// ── Get checklist by user ──

export async function getOnboardingByUser(userId: string): Promise<DbOnboardingChecklist | null> {
  return queryOne<DbOnboardingChecklist>(
    'SELECT * FROM onboarding_checklists WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
    [userId]
  )
}

// ── Get single checklist by ID ──

export async function getOnboardingById(id: string): Promise<DbOnboardingChecklist | null> {
  return queryOne<DbOnboardingChecklist>(
    'SELECT * FROM onboarding_checklists WHERE id = ?',
    [id]
  )
}

// ── Create checklist ──

export async function createOnboarding(data: {
  building_id: string
  user_id: string
  user_name: string
  user_unit?: string | null
}): Promise<DbOnboardingChecklist> {
  const id = crypto.randomUUID()
  await executeInsert(
    `INSERT INTO onboarding_checklists (id, building_id, user_id, user_name, user_unit)
     VALUES (?, ?, ?, ?, ?)`,
    [
      id,
      data.building_id,
      data.user_id,
      data.user_name,
      data.user_unit || null,
    ]
  )
  const created = await getOnboardingById(id)
  return created!
}

// ── Update a checklist item ──

export async function updateOnboardingItem(
  id: string,
  item: string,
  value: boolean
): Promise<void> {
  const allowedItems = [
    'signed_regulation', 'received_keys', 'met_vigilante',
    'met_admin', 'parking_assigned', 'wifi_configured', 'emergency_numbers',
  ]
  if (!allowedItems.includes(item)) {
    throw new Error(`Invalid onboarding item: ${item}`)
  }

  await executeInsert(
    `UPDATE onboarding_checklists SET ${item} = ? WHERE id = ?`,
    [value, id]
  )

  // Check if all items are completed and auto-complete
  const checklist = await getOnboardingById(id)
  if (checklist) {
    const allCompleted =
      checklist.signed_regulation &&
      checklist.received_keys &&
      checklist.met_vigilante &&
      checklist.met_admin &&
      checklist.parking_assigned &&
      checklist.wifi_configured &&
      checklist.emergency_numbers

    if (allCompleted && checklist.status !== 'completed') {
      await executeInsert(
        `UPDATE onboarding_checklists SET status = ?, completed_at = ? WHERE id = ?`,
        ['completed', new Date().toISOString(), id]
      )
    }
  }
}

// ── Complete onboarding ──

export async function completeOnboarding(id: string): Promise<void> {
  await executeInsert(
    `UPDATE onboarding_checklists SET status = ?, completed_at = ? WHERE id = ?`,
    ['completed', new Date().toISOString(), id]
  )
}
