import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { getWorkOrders, createWorkOrder, generateWorkOrdersFromSchedules } from '@/lib/db/queries/maintenance'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/maintenance/work-orders' })

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request)
    if (isAuthResponse(authResult)) return authResult

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    if (!buildingId) {
      return NextResponse.json({ error: 'buildingId required' }, { status: 400 })
    }

    const filters: { status?: string; category?: string } = {}
    if (searchParams.get('status')) filters.status = searchParams.get('status')!
    if (searchParams.get('category')) filters.category = searchParams.get('category')!

    const workOrders = await getWorkOrders(buildingId, filters)
    return NextResponse.json({ workOrders })
  } catch (error) {
    log.error({ error }, 'Error fetching work orders')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, ['admin', 'super_admin'])
    if (isAuthResponse(authResult)) return authResult

    const body = await request.json()
    const { title, description, category, priority, assigned_provider, assigned_provider_phone, scheduled_date, building_id, schedule_id, generate } = body

    // Auto-generate from overdue schedules
    if (generate) {
      if (!building_id) {
        return NextResponse.json({ error: 'buildingId required for generation' }, { status: 400 })
      }
      const generated = await generateWorkOrdersFromSchedules(building_id)
      return NextResponse.json({ workOrders: generated, generated: generated.length })
    }

    if (!title || !category || !building_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const workOrder = await createWorkOrder({
      schedule_id: schedule_id || undefined,
      building_id,
      title,
      description: description || undefined,
      category,
      priority: priority || 'normal',
      assigned_provider: assigned_provider || undefined,
      assigned_provider_phone: assigned_provider_phone || undefined,
      scheduled_date: scheduled_date || undefined,
    })

    return NextResponse.json({ workOrder }, { status: 201 })
  } catch (error) {
    log.error({ error }, 'Error creating work order')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
