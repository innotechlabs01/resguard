import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { getReadings, createReading } from '@/lib/db/queries/utility'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/utility' })

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request)
    if (isAuthResponse(authResult)) return authResult

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    if (!buildingId) {
      return NextResponse.json({ error: 'buildingId required' }, { status: 400 })
    }

    const serviceType = searchParams.get('serviceType') || undefined
    const unitNumber = searchParams.get('unitNumber') || undefined

    const readings = await getReadings(buildingId, serviceType, unitNumber)
    return NextResponse.json({ readings })
  } catch (error) {
    log.error({ error }, 'Error fetching utility readings')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, ['admin', 'super_admin'])
    if (isAuthResponse(authResult)) return authResult

    const body = await request.json()
    const { building_id, unit_number, service_type, reading_date, previous_reading, current_reading, rate_per_unit, notes } = body

    if (!building_id || !unit_number || !service_type || !reading_date || previous_reading == null || current_reading == null || rate_per_unit == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['water', 'gas', 'electricity'].includes(service_type)) {
      return NextResponse.json({ error: 'Invalid service_type' }, { status: 400 })
    }

    const reading = await createReading({
      building_id,
      unit_number,
      service_type,
      reading_date,
      previous_reading,
      current_reading,
      rate_per_unit,
      notes,
    })

    return NextResponse.json({ reading }, { status: 201 })
  } catch (error) {
    log.error({ error }, 'Error creating utility reading')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
