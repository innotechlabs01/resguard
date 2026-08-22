import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { getSchedules, createSchedule } from '@/lib/db/queries/maintenance'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/maintenance/schedules' })

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request)
    if (isAuthResponse(authResult)) return authResult

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    if (!buildingId) {
      return NextResponse.json({ error: 'buildingId required' }, { status: 400 })
    }

    const schedules = await getSchedules(buildingId)
    return NextResponse.json({ schedules })
  } catch (error) {
    log.error({ error }, 'Error fetching maintenance schedules')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, ['admin', 'super_admin'])
    if (isAuthResponse(authResult)) return authResult

    const body = await request.json()
    const { title, description, category, frequency, next_due, assigned_provider, assigned_provider_phone, estimated_cost, priority, building_id } = body

    if (!title || !category || !frequency || !next_due || !building_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const schedule = await createSchedule({
      building_id,
      title,
      description: description || undefined,
      category,
      frequency,
      next_due,
      assigned_provider: assigned_provider || undefined,
      assigned_provider_phone: assigned_provider_phone || undefined,
      estimated_cost: estimated_cost ? parseFloat(estimated_cost) : undefined,
      priority: priority || 'normal',
    })

    return NextResponse.json({ schedule }, { status: 201 })
  } catch (error) {
    log.error({ error }, 'Error creating maintenance schedule')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
