import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { logger } from '@/lib/logger'
import { validateBody, CreateBuildingSchema } from '@/lib/validation'

const log = logger.child({ module: 'api/buildings' })

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('id')
    const { user } = authRes

    const { getBuildings, getBuildingById } = await import('@/lib/db/queries/buildings')
    let buildings: any[] = []
    if (buildingId) {
      const b = await getBuildingById(buildingId)
      if (b && user.role !== 'super_admin' && user.building_id !== b.id) {
        return NextResponse.json([], { status: 200 })
      }
      buildings = b ? [b] : []
    } else {
      if (user.role === 'super_admin') {
        buildings = await getBuildings()
      } else if (user.building_id) {
        const b = await getBuildingById(user.building_id)
        buildings = b ? [b] : []
      } else {
        buildings = []
      }
    }

    return NextResponse.json(buildings)
  } catch (error) {
    log.error({ error }, 'Error fetching buildings')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes
    const { user } = authRes

    const body = await request.json()
    const validation = validateBody(CreateBuildingSchema, body)
    if (!validation.success) return validation.response

    const { createBuilding } = await import('@/lib/db/queries/buildings')

    const monthlyFee = 0
    const currency = validation.data.currency ?? 'COP'

    const buildingId = crypto.randomUUID()
    const createdId = await createBuilding({
      id: buildingId,
      name: validation.data.name,
      address: validation.data.address,
      total_units: validation.data.total_units,
      total_parking_spots: validation.data.total_parking_spots ?? 0,
      visitor_parking_spots: validation.data.visitor_parking_spots ?? 0,
      bold_account_id: null,
      monthly_fee: monthlyFee,
      currency,
      outstanding_balance: 0,
      last_payment_date: null,
      subscription_status: 'pending',
    })

    if (user.id) {
      const { updateUser } = await import('@/lib/db/queries/users')
      await updateUser(user.id, { role: 'admin', building_id: createdId })
    }

    return NextResponse.json({ success: true, message: 'Building created successfully' }, { status: 201 })
  } catch (error) {
    log.error({ error }, 'Error creating building')
    return NextResponse.json({ error: 'Failed to create building' }, { status: 500 })
  }
}
