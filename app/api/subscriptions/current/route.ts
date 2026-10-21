import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { getSupabaseAdmin } from '@/lib/db/supabase'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/subscriptions/current' })

export const dynamic = 'force-dynamic'

/**
 * GET /api/subscriptions/current?organization_id=<uuid>
 * Returns the current subscription for an organization with plan details.
 * Only accessible to org members (titular, admin) or super_admin.
 */
export async function GET(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (isAuthResponse(authRes)) return authRes
    const { user } = authRes

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    if (!organizationId) {
      return NextResponse.json({ error: 'organization_id required' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Verify caller has access to this organization
    if (user.role !== 'super_admin') {
      const callerOrgId = (user as { organization_id?: string }).organization_id
      if (callerOrgId !== organizationId) {
        // Check membership
        const { data: membership } = await admin
          .from('organization_members')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()

        if (!membership) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      }
    }

    // Fetch the latest subscription for the organization
    const { data: sub, error: subError } = await admin
      .from('subscriptions')
      .select(`
        id,
        status,
        current_period_start,
        current_period_end,
        grace_period_end,
        plan_id,
        plans!inner(
          code,
          name,
          price_cop,
          billing_interval,
          features
        )
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (subError || !sub) {
      // No subscription found — return null (caller shows "no subscription" state)
      return NextResponse.json({ subscription: null })
    }

    const planData = (sub as { plans?: unknown }).plans
    const plan = Array.isArray(planData) ? planData[0] : planData

    return NextResponse.json({
      subscription: {
        id: sub.id,
        status: sub.status,
        plan_code: (plan as { code?: string } | undefined)?.code,
        plan_name: (plan as { name?: string } | undefined)?.name,
        price_cop: (plan as { price_cop?: number } | undefined)?.price_cop,
        billing_interval: (plan as { billing_interval?: string } | undefined)?.billing_interval,
        current_period_start: (sub as { current_period_start?: string }).current_period_start,
        current_period_end: (sub as { current_period_end?: string }).current_period_end,
        grace_period_end: (sub as { grace_period_end?: string }).grace_period_end,
        features: (plan as { features?: Record<string, boolean> } | undefined)?.features,
      },
    })
  } catch (error) {
    log.error({ error }, 'Error in GET /api/subscriptions/current')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
