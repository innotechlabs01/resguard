import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { getPqrs, createPqrs } from '@/lib/db/queries/pqrs'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/pqrs' })

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

    const filters: { status?: string; category?: string; priority?: string } = {}
    if (searchParams.get('status')) filters.status = searchParams.get('status')!
    if (searchParams.get('category')) filters.category = searchParams.get('category')!
    if (searchParams.get('priority')) filters.priority = searchParams.get('priority')!

    const pqrs = await getPqrs(buildingId, filters)
    return NextResponse.json({ pqrs })
  } catch (error) {
    log.error({ error }, 'Error fetching PQRS')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request)
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const body = await request.json()
    const { subject, description, category, priority, unit, location_detail, building_id } = body

    if (!subject || !description || !category || !building_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const pqrs = await createPqrs({
      building_id,
      created_by: user.id,
      created_by_name: user.name || user.email,
      created_by_unit: unit || null,
      subject,
      description,
      category,
      priority: priority || 'normal',
      unit: unit || null,
      location_detail: location_detail || null,
    })

    return NextResponse.json({ pqrs }, { status: 201 })
  } catch (error) {
    log.error({ error }, 'Error creating PQRS')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
