import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { assertBuildingAccessAsync, getAdminOrganizationIds } from '@/lib/auth/assertBuildingAccess'
import { logger } from '@/lib/logger'
import { validateBody, CreateBuildingSchema } from '@/lib/validation'
import { checkStrictRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit'
import { checkSubscriptionAccess } from '@/lib/subscription-guard'
import { checkBuildingLimit } from '@/lib/plan-limits'
import { getSupabaseAdmin } from '@/lib/db/supabase'

const log = logger.child({ module: 'api/buildings' })

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('id')
    const { user } = authRes

    const { getBuildings, getBuildingById, getBuildingsByOrganization } = await import('@/lib/db/queries/buildings')
    let buildings: any[] = []
    if (buildingId) {
      const access = await assertBuildingAccessAsync(user, buildingId)
      if (!access.ok) {
        return NextResponse.json([], { status: 200 })
      }
      const b = await getBuildingById(buildingId)
      buildings = b ? [b] : []
    } else if (user.role === 'super_admin') {
      buildings = await getBuildings()
    } else if (user.role === 'admin') {
      const orgIds = await getAdminOrganizationIds(user)
      const byOrg = await Promise.all(orgIds.map((oid) => getBuildingsByOrganization(oid)))
      const map = new Map<string, any>()
      for (const list of byOrg) {
        for (const b of list) map.set(b.id, b)
      }
      if (user.building_id && !map.has(user.building_id)) {
        const legacy = await getBuildingById(user.building_id)
        if (legacy) map.set(legacy.id, legacy)
      }
      buildings = Array.from(map.values())
    } else if (user.building_id) {
      const b = await getBuildingById(user.building_id)
      buildings = b ? [b] : []
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

    if (user.role !== 'super_admin' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Building ID required' }, { status: 400 })
    }

    const access = await assertBuildingAccessAsync(user, id)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    // Whitelist updatable fields (subscription_status is super_admin only)
    const allowed = user.role === 'super_admin'
      ? ['name', 'address', 'total_units', 'total_parking_spots', 'visitor_parking_spots', 'monthly_fee', 'currency', 'subscription_status']
      : ['name', 'address', 'total_units', 'total_parking_spots', 'visitor_parking_spots', 'monthly_fee', 'currency']
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

    // Allow super_admin and admin; block vigilante and usuario
    if (user.role !== 'super_admin' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: only super_admin or admin can create buildings' },
        { status: 403 }
      )
    }

    // Rate limit building creation (10 per hour per user)
    const rlId = getRateLimitIdentifier(request, user.id)
    const rl = await checkStrictRateLimit(`buildings:${rlId}`, 10, '1 h')
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const body = await request.json()
    const validation = validateBody(CreateBuildingSchema, body)
    if (!validation.success) return validation.response

    let organizationId: string | null = body.organization_id || user.organization_id || null
    const supabaseAdmin = getSupabaseAdmin()

    if (user.role === 'admin') {
      // Ensure admin belongs to an organization (create a default one if missing)
      const orgIds = await getAdminOrganizationIds(user)
      if (organizationId && !orgIds.includes(organizationId)) {
        return NextResponse.json({ error: 'Forbidden: organization mismatch' }, { status: 403 })
      }
      if (!organizationId) {
        organizationId = orgIds[0] || null
      }
      if (!organizationId && supabaseAdmin) {
        try {
          const { data: org, error: orgError } = await supabaseAdmin
            .from('organizations')
            .insert({
              name: `Administración ${user.name || user.email}`,
              type: 'hogar',
              owner_user_id: user.id,
              created_by_user_id: user.id,
              contact_email: user.email,
            })
            .select('id')
            .single()

          if (!orgError && org?.id) {
            organizationId = org.id
            await supabaseAdmin.from('organization_members').insert({
              organization_id: org.id,
              user_id: user.id,
              role: 'titular',
              status: 'active',
              joined_at: new Date().toISOString(),
            })
            await supabaseAdmin.from('users').update({ organization_id: org.id }).eq('id', user.id)
          }
        } catch {
          // Continue in legacy mode if organization auto-provisioning fails
        }
      }
    }

    // Guard 1: subscription must be active (not blocked by mora)
    const subGuard = await checkSubscriptionAccess(organizationId)
    if (subGuard) {
      const subData = await subGuard.json()
      return NextResponse.json(subData, { status: subGuard.status })
    }

    // Guard 2: plan limit on buildings (enforced for admin organizations)
    if (organizationId && user.role !== 'super_admin') {
      const limitGuard = await checkBuildingLimit(organizationId)
      if (limitGuard) {
        const limitData = await limitGuard.json()
        return NextResponse.json(limitData, { status: limitGuard.status })
      }
    }

    const { createBuilding } = await import('@/lib/db/queries/buildings')

    const monthlyFee = validation.data.monthly_fee ?? 0
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

    // If admin had no building_id yet, assign this first building automatically
    if (user.role === 'admin' && !user.building_id && supabaseAdmin) {
      await supabaseAdmin
        .from('users')
        .update({ building_id: buildingId })
        .eq('id', user.id)
    }

    return NextResponse.json(
      {
        success: true,
        buildingId,
        organizationId,
        message: 'Building created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    log.error({ error }, 'Error creating building')
    return NextResponse.json({ error: 'Failed to create building' }, { status: 500 })
  }
}
