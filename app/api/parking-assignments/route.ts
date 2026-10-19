import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { assertBuildingAccess } from '@/lib/auth/assertBuildingAccess'
import { getParkingAssignments, getParkingAssignmentById, createOrUpdateParkingAssignment, deleteParkingAssignment } from '@/lib/db/queries/parking-assignments'
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

const ParkingAssignmentUpdateSchema = z.object({
  id: z.string().uuid(),
  assignment_type: z.enum(['owner', 'rented', 'available']),
})

export async function GET(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes
    const { user } = authRes

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    if (!buildingId) {
      return NextResponse.json({ error: 'buildingId required' }, { status: 400 })
    }
    const access = assertBuildingAccess(user, buildingId)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

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

export async function PUT(request: Request) {
  try {
    const authRes = await requireAuth(request, ['admin', 'super_admin'])
    if (authRes instanceof Response) return authRes
    const { user } = authRes

    const body = await request.json()
    const validation = validateBody(ParkingAssignmentUpdateSchema, body)
    if (!validation.success) return validation.response

    const existing = await getParkingAssignmentById(validation.data.id)
    if (!existing) {
      return NextResponse.json({ error: 'Parking assignment not found' }, { status: 404 })
    }
    const access = assertBuildingAccess(user, existing.building_id)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    // Upsert keyed by (building_id, spot_code) updates the existing row's assignment_type only.
    await createOrUpdateParkingAssignment({
      building_id: existing.building_id,
      spot_code: existing.spot_code,
      assignment_type: validation.data.assignment_type,
    })
    return NextResponse.json({ success: true, message: 'Parking assignment updated' })
  } catch (error) {
    log.error({ error }, 'Error updating parking assignment')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const authRes = await requireAuth(request, ['admin', 'super_admin'])
    if (authRes instanceof Response) return authRes
    const { user } = authRes

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Parking assignment ID required' }, { status: 400 })
    }

    const existing = await getParkingAssignmentById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Parking assignment not found' }, { status: 404 })
    }
    const access = assertBuildingAccess(user, existing.building_id)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    await deleteParkingAssignment(id)
    return NextResponse.json({ success: true, message: 'Parking assignment deleted' })
  } catch (error) {
    log.error({ error }, 'Error deleting parking assignment')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
