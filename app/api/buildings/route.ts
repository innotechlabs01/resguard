import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { logger } from '@/lib/logger'
import { validateBody, CreateBuildingSchema } from '@/lib/validation'
import { checkStrictRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit'
import { checkSubscriptionAccess } from '@/lib/subscription-guard'
import { checkBuildingLimit } from '@/lib/plan-limits'

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

export async function PUT(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes
    const { user } = authRes

    // Only super_admin can update building configuration
    if (user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Building ID required' }, { status: 400 })
    }

    // Whitelist updatable fields (prevent mass-assignment of sensitive fields)
    const allowed = ['name', 'address', 'total_units', 'total_parking_spots', 'visitor_parking_spots', 'monthly_fee', 'currency', 'subscription_status']
    const filtered: Record<string, unknown> = {}
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        filtered[key] = updates[key]
      }
    }

    if (Object.keys(filtered).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { updateBuilding } = await import('@/lib/db/queries/buildings')
    await updateBuilding(id, filtered)

    return NextResponse.json({ success: true, message: 'Building updated successfully' })
  } catch (error) {
    log.error({ error }, 'Error updating building')
    return NextResponse.json({ error: 'Failed to update building' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes
    const { user } = authRes

    // N4 fix: only super_admin can create buildings (CRM model, T-023 Phase 2.1).
    // No auto-promotion: admin assignment is a separate, explicit flow
    // (buildings-panel "Asignar admin" → POST /api/users).
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden: only super_admin can create buildings' },
        { status: 403 }
      )
    }

    // M3 fix: rate limit building creation (10 per hour per user)
    const rlId = getRateLimitIdentifier(request, user.id)
    const rl = await checkStrictRateLimit(`buildings:${rlId}`, 10, '1 h')
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // ─── Multi-tenant guards ───
    // Get the caller's organization (if they have one)
    const body = await request.json()
    const callerOrgId = (user as { organization_id?: string }).organization_id
    const organizationId = body.organization_id || callerOrgId || null

    // Guard 1: subscription must be active (not blocked by mora)
    const subGuard = await checkSubscriptionAccess(organizationId)
    if (subGuard) {
      const subData = await subGuard.json()
      return NextResponse.json(subData, { status: subGuard.status })
    }

    // Guard 2: plan limit on buildings (only for organizations, not super_admin creating standalone)
    if (organizationId && user.role !== 'super_admin') {
      const limitGuard = await checkBuildingLimit(organizationId)
      if (limitGuard) {
        const limitData = await limitGuard.json()
        return NextResponse.json(limitData, { status: limitGuard.status })
      }
    }

    const validation = validateBody(CreateBuildingSchema, body)
    if (!validation.success) return validation.response

    const { createBuilding } = await import('@/lib/db/queries/buildings')

    const monthlyFee = 0
    const currency = validation.data.currency ?? 'COP'

    const buildingId = crypto.randomUUID()
    await createBuilding({
      id: buildingId,
      organization_id: organizationId,
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

    return NextResponse.json({ success: true, message: 'Building created successfully' }, { status: 201 })
  } catch (error) {
    log.error({ error }, 'Error creating building')
    return NextResponse.json({ error: 'Failed to create building' }, { status: 500 })
  }
}
