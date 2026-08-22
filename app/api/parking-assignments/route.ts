import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { getParkingAssignments, createOrUpdateParkingAssignment } from '@/lib/db/queries/parking-assignments'
import { validateBody } from '@/lib/validation'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/parking-assignments' })

export const dynamic = 'force-dynamic'

const ParkingAssignmentSchema = z.object({
  building_id: z.string().uuid(),
  spot_code: z.string().min(1).max(20),
  assignment_type: z.enum(['owner', 'rented', 'available']),
  owner_id: z.string().optional(),
  owner_name: z.string().max(100).optional(),
  owner_unit: z.string().max(20).optional(),
  tenant_name: z.string().max(100).optional(),
  tenant_unit: z.string().max(20).optional(),
  vehicle_plate: z.string().max(20).optional(),
  vehicle_brand: z.string().max(50).optional(),
  vehicle_color: z.string().max(30).optional(),
})

export async function GET(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    if (!buildingId) {
      return NextResponse.json({ error: 'buildingId required' }, { status: 400 })
    }

    const assignments = await getParkingAssignments(buildingId)
    return NextResponse.json({ assignments })
  } catch (error) {
    log.error({ error }, 'Error fetching parking assignments')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes

    const body = await request.json()
    const validation = validateBody(ParkingAssignmentSchema, body)
    if (!validation.success) return validation.response

    await createOrUpdateParkingAssignment(validation.data)
    return NextResponse.json({ success: true, message: 'Parking assignment saved' }, { status: 201 })
  } catch (error) {
    log.error({ error }, 'Error saving parking assignment')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
