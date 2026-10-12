import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { assertBuildingAccess } from '@/lib/auth/assertBuildingAccess'
import { getInfractions, reportInfraction } from '@/lib/db/queries/infractions'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/infractions' })

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request)
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    if (!buildingId) {
      return NextResponse.json({ error: 'buildingId required' }, { status: 400 })
    }
    const access = assertBuildingAccess(user, buildingId)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const filters: { status?: string; infraction_type?: string } = {}
    if (searchParams.get('status')) filters.status = searchParams.get('status')!
    if (searchParams.get('infraction_type')) filters.infraction_type = searchParams.get('infraction_type')!

    // Pagination: page (1-based), pageSize (default 20, max 100)
    const rawPage = searchParams.get('page')
    const rawPageSize = searchParams.get('pageSize')
    let page: number | undefined
    let pageSize: number | undefined
    if (rawPage !== null) {
      const parsed = Number.parseInt(rawPage, 10)
      if (!Number.isInteger(parsed) || parsed < 1) {
        return NextResponse.json({ error: 'page must be a positive integer' }, { status: 400 })
      }
      page = parsed
    }
    if (rawPageSize !== null) {
      const parsed = Number.parseInt(rawPageSize, 10)
      if (!Number.isInteger(parsed) || parsed < 1) {
        return NextResponse.json({ error: 'pageSize must be a positive integer' }, { status: 400 })
      }
      pageSize = Math.min(parsed, 100)
    }

    const result = await getInfractions(buildingId, filters, page, pageSize)
    return NextResponse.json({ infractions: result.items, total: result.total, page: result.page, pageSize: result.pageSize })
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
    const access = assertBuildingAccess(user, building_id)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

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
