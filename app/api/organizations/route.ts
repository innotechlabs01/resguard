import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { getSupabaseAdmin } from '@/lib/db/supabase'
import { getSuperAdminOrganizationsCrm } from '@/lib/db/queries/stats'
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

const UpdateOrgSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['active', 'suspended', 'blocked', 'canceled']).optional(),
  type: z.enum(['hogar', 'grupo', 'comunidad', 'inmobiliaria']).optional(),
  name: z.string().min(2).max(200).optional(),
  contact_email: z.string().email().nullable().optional(),
  contact_phone: z.string().max(30).nullable().optional(),
  plan_code: z
    .enum(['basico', 'profesional', 'corporativo', 'hogar', 'grupo', 'comunidad', 'inmobiliaria'])
    .optional(),
})

const PLAN_CODE_FALLBACKS: Record<string, string[]> = {
  basico: ['basico', 'comunidad', 'grupo', 'hogar'],
  profesional: ['profesional'],
  corporativo: ['corporativo', 'inmobiliaria'],
  hogar: ['hogar', 'basico'],
  grupo: ['grupo', 'basico'],
  comunidad: ['comunidad', 'profesional'],
  inmobiliaria: ['inmobiliaria', 'corporativo'],
}

/**
 * GET /api/organizations
 * - super_admin: sees all organizations enriched with CRM data
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

    if (user.role === 'super_admin') {
      const organizations = await getSuperAdminOrganizationsCrm()
      return NextResponse.json({ organizations })
    }

    let query = admin.from('organizations').select('*')

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

/**
 * PATCH /api/organizations — Super Admin CRM updates (status, type, contact info, plan).
 * Only super_admin is allowed. All changes are recorded in audit_log.
 */
export async function PATCH(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (isAuthResponse(authRes)) return authRes
    const { user } = authRes

    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Solo Super Admin puede modificar organizaciones.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = UpdateOrgSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { id, status, type, name, contact_email, contact_phone, plan_code } = parsed.data
    const hasOrgFields =
      status !== undefined ||
      type !== undefined ||
      name !== undefined ||
      contact_email !== undefined ||
      contact_phone !== undefined

    if (!hasOrgFields && !plan_code) {
      return NextResponse.json(
        { error: 'Debes enviar al menos un campo para actualizar.' },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data: existingOrg, error: fetchError } = await admin
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingOrg) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 })
    }

    const now = new Date().toISOString()
    const orgUpdates: Record<string, unknown> = {}
    if (status !== undefined) orgUpdates.status = status
    if (type !== undefined) orgUpdates.type = type
    if (name !== undefined) orgUpdates.name = name
    if (contact_email !== undefined) orgUpdates.contact_email = contact_email
    if (contact_phone !== undefined) orgUpdates.contact_phone = contact_phone

    let updatedOrg = existingOrg
    if (Object.keys(orgUpdates).length > 0) {
      orgUpdates.updated_at = now
      const { data: savedOrg, error: updateError } = await admin
        .from('organizations')
        .update(orgUpdates)
        .eq('id', id)
        .select()
        .single()

      if (updateError || !savedOrg) {
        log.error({ error: updateError, id }, 'Failed to update organization')
        return NextResponse.json({ error: 'Error al actualizar organización' }, { status: 500 })
      }
      updatedOrg = savedOrg
    }

    let updatedSubscription: Record<string, unknown> | null = null
    if (plan_code) {
      const candidateCodes = PLAN_CODE_FALLBACKS[plan_code] || [plan_code]
      const { data: plansData, error: plansError } = await admin
        .from('plans')
        .select('id, code, name, max_buildings, max_admin_users, max_units, price_cop')
        .in('code', candidateCodes)

      if (plansError) {
        log.error({ error: plansError, plan_code }, 'Failed to look up plan')
        return NextResponse.json({ error: 'Error consultando catálogo de planes' }, { status: 500 })
      }

      const plan =
        candidateCodes
          .map(code => (plansData || []).find((p: { code: string }) => p.code === code))
          .find(Boolean) || null

      if (!plan) {
        return NextResponse.json(
          { error: `Plan "${plan_code}" no encontrado en el catálogo.` },
          { status: 404 }
        )
      }

      const { data: existingSubs } = await admin
        .from('subscriptions')
        .select('id, building_id, status')
        .eq('organization_id', id)
        .order('created_at', { ascending: false })
        .limit(1)

      const existingSub = existingSubs?.[0]
      if (existingSub) {
        const { data: savedSub, error: subUpdateError } = await admin
          .from('subscriptions')
          .update({
            plan_id: plan.id,
            status: 'active',
            blocked_at: null,
            updated_at: now,
          })
          .eq('id', existingSub.id)
          .select()
          .single()

        if (subUpdateError) {
          log.error({ error: subUpdateError, id }, 'Failed to update organization subscription')
          return NextResponse.json({ error: 'Error al actualizar suscripción' }, { status: 500 })
        }
        updatedSubscription = { ...savedSub, plan }
      } else {
        const { data: orgBuildings } = await admin
          .from('buildings')
          .select('id')
          .eq('organization_id', id)
          .limit(1)

        const targetBuildingId = orgBuildings?.[0]?.id ?? id
        const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

        const { data: insertedSub, error: subInsertError } = await admin
          .from('subscriptions')
          .insert({
            organization_id: id,
            building_id: targetBuildingId,
            plan_id: plan.id,
            status: 'active',
            current_period_start: now,
            current_period_end: periodEnd,
          })
          .select()
          .single()

        if (subInsertError) {
          log.error({ error: subInsertError, id }, 'Failed to create organization subscription')
          return NextResponse.json({ error: 'Error al asignar plan a la organización' }, { status: 500 })
        }
        updatedSubscription = { ...insertedSub, plan }
      }
    }

    await admin.from('audit_log').insert({
      actor_user_id: user.id,
      action: 'organization_updated',
      entity_type: 'organization',
      entity_id: id,
      details: {
        previous: {
          status: existingOrg.status,
          type: existingOrg.type,
          name: existingOrg.name,
          contact_email: existingOrg.contact_email,
          contact_phone: existingOrg.contact_phone,
        },
        updated: orgUpdates,
        plan_code: plan_code ?? null,
      },
    })

    return NextResponse.json({
      organization: updatedOrg,
      subscription: updatedSubscription,
      message: 'Organización actualizada correctamente.',
    })
  } catch (error) {
    log.error({ error }, 'Error in PATCH /api/organizations')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
