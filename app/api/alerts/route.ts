import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { assertBuildingAccess } from '@/lib/auth/assertBuildingAccess'
import { getAlerts, createAlert, updateAlert, deleteAlert, getAlertById } from '@/lib/db/queries/alerts'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/alerts' })

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes
    const { user } = authRes

    const { searchParams } = new URL(request.url)
    const requestedId = searchParams.get('buildingId')
    // Scope: non-super_admin users are always limited to their own building.
    // super_admin may omit buildingId for a global view (by design).
    const buildingId = user.role === 'super_admin' ? requestedId : user.building_id
    if (!buildingId) {
      if (user.role === 'super_admin') {
        const alerts = await getAlerts(undefined)
        return NextResponse.json(alerts)
      }
      return NextResponse.json({ error: 'Forbidden: building scope required' }, { status: 403 })
    }
    const access = assertBuildingAccess(user, buildingId)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const alerts = await getAlerts(buildingId)
    return NextResponse.json(alerts)
  } catch (error) {
    log.error({ error }, 'Error fetching alerts')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes

    const { user } = authRes

    const body = await request.json()

    // Scope: non-super_admin users can only create alerts for their own building.
    let buildingId: string
    if (user.role === 'super_admin') {
      if (!body.building_id) {
        return NextResponse.json({ error: 'building_id required' }, { status: 400 })
      }
      buildingId = body.building_id
    } else {
      if (!user.building_id) {
        return NextResponse.json({ error: 'Forbidden: building scope required' }, { status: 403 })
      }
      if (body.building_id && body.building_id !== user.building_id) {
        return NextResponse.json({ error: 'Forbidden: building mismatch' }, { status: 403 })
      }
      buildingId = user.building_id
    }

    const alertData = {
      building_id: buildingId,
      type: body.type,
      title: body.title,
      message: body.message,
      priority: body.priority || 'medium',
      read: body.read || false,
      action_required: body.action_required || false,
      related_id: body.related_id || null,
    }

    await createAlert(alertData)
    return NextResponse.json({ success: true, message: 'Alert created successfully' }, { status: 201 })
  } catch (error) {
    log.error({ error }, 'Error creating alert')
    return NextResponse.json({ error: 'Failed to create alert', details: String(error) }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes

    const { user } = authRes

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Alert ID required' }, { status: 400 })
    }

    // Mutation by id: read → assert building access → mutate
    const existing = await getAlertById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }
    const access = assertBuildingAccess(user, existing.building_id)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    await updateAlert(id, updates)
    return NextResponse.json({ success: true, message: 'Alert updated successfully' })
  } catch (error) {
    log.error({ error }, 'Error updating alert')
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes

    const { user } = authRes

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Alert ID required' }, { status: 400 })
    }

    // Mutation by id: read → assert building access → mutate
    const existing = await getAlertById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }
    const access = assertBuildingAccess(user, existing.building_id)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    await deleteAlert(id)
    return NextResponse.json({ success: true, message: 'Alert deleted successfully' })
  } catch (error) {
    log.error({ error }, 'Error deleting alert')
    return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 })
  }
}
