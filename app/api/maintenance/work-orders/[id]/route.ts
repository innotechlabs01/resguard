import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { assertResourceBuilding } from '@/lib/auth/assertBuildingAccess'
import { getWorkOrderById, updateWorkOrderStatus } from '@/lib/db/queries/maintenance'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/maintenance/work-orders/[id]' })

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(_request)
    if (isAuthResponse(authResult)) return authResult

    const { id } = await params
    const workOrder = await getWorkOrderById(id)
    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    const access = assertResourceBuilding(authResult.user, workOrder.building_id)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    return NextResponse.json({ workOrder })
  } catch (error) {
    log.error({ error }, 'Error fetching work order')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request, ['admin', 'super_admin'])
    if (isAuthResponse(authResult)) return authResult

    const { id } = await params
    const existing = await getWorkOrderById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }
    const access = assertResourceBuilding(authResult.user, existing.building_id)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const body = await request.json()
    const { status, notes } = body

    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 })
    }

    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    await updateWorkOrderStatus(id, status, notes || undefined)
    const workOrder = await getWorkOrderById(id)

    return NextResponse.json({ workOrder })
  } catch (error) {
    log.error({ error }, 'Error updating work order')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
