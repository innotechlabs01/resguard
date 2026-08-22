import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { getInfractions, reportInfraction } from '@/lib/db/queries/infractions'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/infractions' })

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request)
    if (isAuthResponse(authResult)) return authResult

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    if (!buildingId) {
      return NextResponse.json({ error: 'buildingId required' }, { status: 400 })
    }

    const filters: { status?: string; infraction_type?: string } = {}
    if (searchParams.get('status')) filters.status = searchParams.get('status')!
    if (searchParams.get('infraction_type')) filters.infraction_type = searchParams.get('infraction_type')!

    const infractions = await getInfractions(buildingId, filters)
    return NextResponse.json({ infractions })
  } catch (error) {
    log.error({ error }, 'Error fetching infractions')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request)
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const body = await request.json()
    const { infraction_type, description, location, target_unit, building_id } = body

    if (!infraction_type || !description || !target_unit || !building_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const infraction = await reportInfraction({
      building_id,
      reporter_id: user.id,
      reporter_name: user.name || user.email,
      reporter_unit: null,
      infraction_type,
      description,
      location: location || null,
      target_unit,
    })

    return NextResponse.json({ infraction }, { status: 201 })
  } catch (error) {
    log.error({ error }, 'Error reporting infraction')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
