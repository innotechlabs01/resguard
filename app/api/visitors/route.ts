import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { getVisitors, createVisitor, updateVisitor, deleteVisitor } from '@/lib/db/queries/visitors'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/visitors' })

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    if (!buildingId) {
      return NextResponse.json({ error: 'buildingId required' }, { status: 400 })
    }

    const visitors = await getVisitors(buildingId)
    return NextResponse.json({ visitors })
  } catch (error) {
    log.error({ error }, 'Error fetching visitors')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes

    const body = await request.json()
    
    const visitorData = {
      building_id: body.building_id,
      name: body.name,
      document_id: body.document_id,
      type: body.type || 'pedestrian',
      vehicle_plate: body.vehicle_plate || null,
      destination_unit: body.destination_unit,
      resident_name: body.resident_name,
      entry_time: body.entry_time || new Date().toISOString(),
      status: body.status || 'inside',
      exit_time: body.exit_time || null,
      parking_spot: body.parking_spot || null,
    }

    await createVisitor(visitorData)
    return NextResponse.json({ success: true, message: 'Visitor registered successfully' }, { status: 201 })
  } catch (error) {
    log.error({ error }, 'Error creating visitor')
    return NextResponse.json({ error: 'Failed to register visitor', details: String(error) }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Visitor ID required' }, { status: 400 })
    }

    await updateVisitor(id, updates)
    return NextResponse.json({ success: true, message: 'Visitor updated successfully' })
  } catch (error) {
    log.error({ error }, 'Error updating visitor')
    return NextResponse.json({ error: 'Failed to update visitor' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Visitor ID required' }, { status: 400 })
    }

    await deleteVisitor(id)
    return NextResponse.json({ success: true, message: 'Visitor deleted successfully' })
  } catch (error) {
    log.error({ error }, 'Error deleting visitor')
    return NextResponse.json({ error: 'Failed to delete visitor' }, { status: 500 })
  }
}
