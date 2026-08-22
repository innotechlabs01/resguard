import 'server-only'
import { queryMany, queryOne, executeInsert } from './helpers'
import type { InValue } from './helpers'

export interface DbProvider {
  id: string
  building_id: string
  name: string
  category: string
  phone: string
  whatsapp: string | null
  email: string | null
  description: string | null
  verified_by: string | null
  is_verified: boolean
  avg_rating: number
  total_reviews: number
  created_at: string
  updated_at: string
}

export interface DbProviderReview {
  id: string
  provider_id: string
  reviewer_id: string
  reviewer_name: string
  rating: number
  comment: string | null
  created_at: string
}

// ── List providers with optional category filter ──

export async function getProviders(
  buildingId: string,
  category?: string
): Promise<DbProvider[]> {
  const conditions: InValue[] = [buildingId]
  const wheres: string[] = ['building_id = ?']

  if (category) {
    wheres.push('category = ?')
    conditions.push(category)
  }

  const sql = `SELECT * FROM verified_providers WHERE ${wheres.join(' AND ')} ORDER BY avg_rating DESC, name ASC`
  return queryMany<DbProvider>(sql, conditions)
}

// ── Get provider by ID with reviews ──

export async function getProviderById(id: string): Promise<{ provider: DbProvider; reviews: DbProviderReview[] } | null> {
  const provider = await queryOne<DbProvider>(
    'SELECT * FROM verified_providers WHERE id = ?',
    [id]
  )
  if (!provider) return null

  const reviews = await queryMany<DbProviderReview>(
    'SELECT * FROM provider_reviews WHERE provider_id = ? ORDER BY created_at DESC',
    [id]
  )

  return { provider, reviews }
}

// ── Create provider (admin) ──

export async function createProvider(data: {
  building_id: string
  name: string
  category: string
  phone: string
  whatsapp?: string
  email?: string
  description?: string
  verified_by?: string
}): Promise<DbProvider> {
  const id = crypto.randomUUID()
  await executeInsert(
    `INSERT INTO verified_providers (id, building_id, name, category, phone, whatsapp, email, description, verified_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.building_id,
      data.name,
      data.category,
      data.phone,
      data.whatsapp || null,
      data.email || null,
      data.description || null,
      data.verified_by || null,
    ]
  )
  const created = await queryOne<DbProvider>(
    'SELECT * FROM verified_providers WHERE id = ?',
    [id]
  )
  return created!
}

// ── Add review ──

export async function addReview(data: {
  provider_id: string
  reviewer_id: string
  reviewer_name: string
  rating: number
  comment?: string
}): Promise<DbProviderReview> {
  const id = crypto.randomUUID()
  await executeInsert(
    `INSERT INTO provider_reviews (id, provider_id, reviewer_id, reviewer_name, rating, comment)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.provider_id,
      data.reviewer_id,
      data.reviewer_name,
      data.rating,
      data.comment || null,
    ]
  )

  // Update provider rating
  await updateProviderRating(data.provider_id)

  return {
    id,
    provider_id: data.provider_id,
    reviewer_id: data.reviewer_id,
    reviewer_name: data.reviewer_name,
    rating: data.rating,
    comment: data.comment || null,
    created_at: new Date().toISOString(),
  }
}

// ── Update provider average rating ──

export async function updateProviderRating(providerId: string): Promise<void> {
  const reviews = await queryMany<DbProviderReview>(
    'SELECT rating FROM provider_reviews WHERE provider_id = ?',
    [providerId]
  )

  const totalReviews = reviews.length
  const avgRating = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0

  await executeInsert(
    'UPDATE verified_providers SET avg_rating = ?, total_reviews = ? WHERE id = ?',
    [Math.round(avgRating * 100) / 100, totalReviews, providerId]
  )
}
