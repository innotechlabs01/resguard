import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { getAlerts, createAlert, updateAlert, deleteAlert } from '@/lib/db/queries/alerts'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/alerts' })

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId') ?? undefined

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

    const body = await request.json()
    
    const alertData = {
      building_id: body.building_id,
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

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Alert ID required' }, { status: 400 })
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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Alert ID required' }, { status: 400 })
    }

    await deleteAlert(id)
    return NextResponse.json({ success: true, message: 'Alert deleted successfully' })
  } catch (error) {
    log.error({ error }, 'Error deleting alert')
    return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 })
  }
}
