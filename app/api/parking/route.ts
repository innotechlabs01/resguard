import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { getParkingSpots, createParkingSpot, updateParkingSpot, deleteParkingSpot } from '@/lib/db/queries/parking'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/parking' })

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

    const spots = await getParkingSpots(buildingId)
    return NextResponse.json({ spots })
  } catch (error) {
    log.error({ error }, 'Error fetching parking spots')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes

    const body = await request.json()
    
    const spotData = {
      building_id: body.building_id,
      code: body.code,
      status: body.status || 'available',
      max_duration: body.max_duration || 120,
      vehicle_plate: body.vehicle_plate || null,
      visitor_name: body.visitor_name || null,
      resident_unit: body.resident_unit || null,
      entry_time: body.entry_time || null,
      time_remaining: body.time_remaining || null,
    }

    await createParkingSpot(spotData)
    return NextResponse.json({ success: true, message: 'Parking spot created successfully' }, { status: 201 })
  } catch (error) {
    log.error({ error }, 'Error creating parking spot')
    return NextResponse.json({ error: 'Failed to create parking spot', details: String(error) }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Parking spot ID required' }, { status: 400 })
    }

    await updateParkingSpot(id, updates)
    return NextResponse.json({ success: true, message: 'Parking spot updated successfully' })
  } catch (error) {
    log.error({ error }, 'Error updating parking spot')
    return NextResponse.json({ error: 'Failed to update parking spot' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Parking spot ID required' }, { status: 400 })
    }

    await deleteParkingSpot(id)
    return NextResponse.json({ success: true, message: 'Parking spot deleted successfully' })
  } catch (error) {
    log.error({ error }, 'Error deleting parking spot')
    return NextResponse.json({ error: 'Failed to delete parking spot' }, { status: 500 })
  }
}
