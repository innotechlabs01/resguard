import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { getSupabaseAdmin } from '@/lib/db/supabase'
import { checkStrictRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/organizations' })

export const dynamic = 'force-dynamic'

const CreateOrgSchema = z.object({
  name: z.string().min(2).max(200),
  type: z.enum(['hogar', 'grupo', 'comunidad', 'inmobiliaria']),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().max(30).optional(),
})

/**
 * GET /api/organizations
 * - super_admin: sees all organizations
 * - others: sees organizations they're a member of or own
 */
export async function GET(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (isAuthResponse(authRes)) return authRes
    const { user } = authRes

    const admin = getSupabaseAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    let query = admin.from('organizations').select('*')

    if (user.role !== 'super_admin') {
      // Non-super_admin: only see orgs where they're a member or owner
      const { data: memberOrgs } = await admin
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('status', 'active')

      const { data: ownedOrgs } = await admin
        .from('organizations')
        .select('id')
        .eq('owner_user_id', user.id)

      const orgIds = [
        ...(memberOrgs || []).map((m: { organization_id: string }) => m.organization_id),
        ...(ownedOrgs || []).map((o: { id: string }) => o.id),
      ]

      if (orgIds.length === 0) {
        return NextResponse.json({ organizations: [] })
      }

      query = query.in('id', orgIds)
    }

    const { data: organizations, error } = await query.order('created_at', { ascending: false })

    if (error) {
      log.error({ error }, 'Failed to fetch organizations')
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ organizations: organizations || [] })
  } catch (error) {
    log.error({ error }, 'Error in GET /api/organizations')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/organizations — create an organization.
 * The authenticated user becomes the owner (titular).
 * Rate limited: 3 orgs per hour per user (prevents abuse).
 */
export async function POST(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (isAuthResponse(authRes)) return authRes
    const { user } = authRes

    // Rate limit: 3 organizations per hour
    const rlId = getRateLimitIdentifier(request, user.id)
    const rl = await checkStrictRateLimit(`org-create:${rlId}`, 3, '1 h')
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const body = await request.json()
    const parsed = CreateOrgSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Create the organization — the caller becomes the owner (titular)
    const { data: org, error: orgError } = await admin
      .from('organizations')
      .insert({
        name: parsed.data.name,
        type: parsed.data.type,
        owner_user_id: user.id,
        created_by_user_id: user.id,
        contact_email: parsed.data.contact_email || user.email,
        contact_phone: parsed.data.contact_phone || null,
      })
      .select()
      .single()

    if (orgError || !org) {
      log.error({ error: orgError }, 'Failed to create organization')
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
    }

    // Create the owner's membership as 'titular'
    const { error: memberError } = await admin
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: user.id,
        role: 'titular',
        status: 'active',
        joined_at: new Date().toISOString(),
      })

    if (memberError) {
      log.error({ error: memberError }, 'Failed to create owner membership')
      // Rollback the org
      await admin.from('organizations').delete().eq('id', org.id)
      return NextResponse.json({ error: 'Failed to setup organization' }, { status: 500 })
    }

    // Update user's organization_id for quick lookup
    await admin
      .from('users')
      .update({ organization_id: org.id })
      .eq('id', user.id)

    // Log to audit trail
    await admin.from('audit_log').insert({
      actor_user_id: user.id,
      action: 'organization_created',
      entity_type: 'organization',
      entity_id: org.id,
      details: { name: parsed.data.name, type: parsed.data.type },
    })

    return NextResponse.json(
      {
        organization: org,
        message: 'Organización creada. Ya puedes agregar edificios y invitar usuarios.',
      },
      { status: 201 }
    )
  } catch (error) {
    log.error({ error }, 'Error in POST /api/organizations')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
