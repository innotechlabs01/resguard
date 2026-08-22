import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { getProviderById, addReview } from '@/lib/db/queries/providers'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/providers/[id]' })

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (isAuthResponse(authResult)) return authResult

    const { id } = await params
    const result = await getProviderById(id)
    if (!result) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    log.error({ error }, 'Error fetching provider')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const { id } = await params
    const body = await request.json()
    const { rating, comment } = body

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    // Check provider exists
    const existing = await getProviderById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    const review = await addReview({
      provider_id: id,
      reviewer_id: user.id,
      reviewer_name: user.name || user.email,
      rating,
      comment,
    })

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    log.error({ error }, 'Error adding review')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
