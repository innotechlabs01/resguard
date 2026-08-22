import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { getRentalListings } from '@/lib/db/queries/rentals'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/rentals' })

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, ['usuario', 'admin'])
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    if (!buildingId) {
      return NextResponse.json({ error: 'buildingId required' }, { status: 400 })
    }

    const listings = await getRentalListings(buildingId)
    return NextResponse.json({ listings })
  } catch (error) {
    log.error({ error }, 'Error fetching rental listings')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
