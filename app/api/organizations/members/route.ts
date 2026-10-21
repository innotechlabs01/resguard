import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { getSupabaseAdmin } from '@/lib/db/supabase'
import { checkSubscriptionAccess } from '@/lib/subscription-guard'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/organizations/members' })

export const dynamic = 'force-dynamic'

const InviteMemberSchema = z.object({
  organization_id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['admin', 'resident']),
  building_id: z.string().uuid().optional(),
})

/**
 * GET /api/organizations/members?organization_id=<uuid>
 * Lists members of an organization (titular/admin see all; residents see active only).
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

    // Verify the caller has access to this organization
    const { data: callerMembership } = await admin
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    const { data: org } = await admin
      .from('organizations')
      .select('owner_user_id')
      .eq('id', organizationId)
      .single()

    const isOwner = org?.owner_user_id === user.id
    const isSuperAdmin = user.role === 'super_admin'

    if (!callerMembership && !isOwner && !isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: members, error } = await admin
      .from('organization_members')
      .select(`
        id,
        role,
        status,
        invited_at,
        joined_at,
        users!inner(id, name, email)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true })

    if (error) {
      log.error({ error }, 'Failed to fetch org members')
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ members: members || [] })
  } catch (error) {
    log.error({ error }, 'Error in GET members')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/organizations/members — invite a member to an organization.
 * Only titular, org admin, or super_admin can invite.
 * The invited user receives an email invitation (existing flow via inviteUserByEmail).
 */
export async function POST(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (isAuthResponse(authRes)) return authRes
    const { user: caller } = authRes

    const body = await request.json()
    const parsed = InviteMemberSchema.safeParse(body)
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

    // Verify caller has permission to invite to this organization
    const { data: org } = await admin
      .from('organizations')
      .select('id, owner_user_id, name')
      .eq('id', parsed.data.organization_id)
      .single()

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const { data: callerMembership } = await admin
      .from('organization_members')
      .select('role')
      .eq('organization_id', parsed.data.organization_id)
      .eq('user_id', caller.id)
      .eq('status', 'active')
      .single()

    const isOwner = org.owner_user_id === caller.id
    const isSuperAdmin = caller.role === 'super_admin'
    const isOrgAdmin = callerMembership?.role === 'admin' || callerMembership?.role === 'titular'

    if (!isOwner && !isOrgAdmin && !isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden: only org admins can invite' }, { status: 403 })
    }

    // Check subscription: can't invite if org is blocked
    const subGuard = await checkSubscriptionAccess(parsed.data.organization_id)
    if (subGuard) {
      return NextResponse.json(
        { error: 'subscription_blocked', message: 'La organización está bloqueada por mora.' },
        { status: 402 }
      )
    }

    // Check if the user already exists
    const { data: existingUser } = await admin
      .from('users')
      .select('id, name, email')
      .eq('email', parsed.data.email.trim().toLowerCase())
      .single()

    if (existingUser) {
      // Check if already a member
      const { data: existingMember } = await admin
        .from('organization_members')
        .select('id, status')
        .eq('organization_id', parsed.data.organization_id)
        .eq('user_id', existingUser.id)
        .single()

      if (existingMember) {
        if (existingMember.status === 'active') {
          return NextResponse.json(
            { error: 'El usuario ya es miembro de esta organización' },
            { status: 409 }
          )
        }
        // Re-invite: update the existing membership
        const { data: updated } = await admin
          .from('organization_members')
          .update({ status: 'invited', invited_at: new Date().toISOString(), invited_by_user_id: caller.id })
          .eq('id', existingMember.id)
          .select()
          .single()

        return NextResponse.json({ member: updated, invitationSent: true }, { status: 200 })
      }

      // Add existing user as member
      const { data: member, error: memberError } = await admin
        .from('organization_members')
        .insert({
          organization_id: parsed.data.organization_id,
          user_id: existingUser.id,
          role: parsed.data.role,
          status: 'invited',
          invited_by_user_id: caller.id,
          invited_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (memberError) {
        log.error({ error: memberError }, 'Failed to add existing user as member')
        return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
      }

      return NextResponse.json({ member, invitationSent: true }, { status: 201 })
    }

    // User doesn't exist: send an email invitation (creates auth account)
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
    const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      parsed.data.email.trim().toLowerCase(),
      {
        redirectTo: `${origin}/auth/confirm`,
        data: {
          name: parsed.data.email.split('@')[0],
          organization_id: parsed.data.organization_id,
          member_role: parsed.data.role,
        },
      }
    )

    if (inviteError || !inviteData?.user) {
      if (inviteError?.message?.includes('already registered')) {
        return NextResponse.json({ error: 'El correo ya está registrado' }, { status: 409 })
      }
      log.error({ error: inviteError }, 'Failed to send invitation')
      return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 })
    }

    // Create the profile (trigger creates it with role=usuario; update with org data)
    const { error: profileError } = await admin
      .from('users')
      .upsert({
        id: inviteData.user.id,
        email: parsed.data.email.trim().toLowerCase(),
        name: parsed.data.email.split('@')[0],
        role: parsed.data.role === 'admin' ? 'admin' : 'usuario',
        organization_id: parsed.data.organization_id,
        building_id: parsed.data.building_id || null,
      })

    if (profileError) {
      log.warn({ error: profileError }, 'Profile upsert after invite — may already exist')
    }

    // Create the membership
    const { data: member, error: memberError } = await admin
      .from('organization_members')
      .insert({
        organization_id: parsed.data.organization_id,
        user_id: inviteData.user.id,
        role: parsed.data.role,
        status: 'invited',
        invited_by_user_id: caller.id,
        invited_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (memberError) {
      log.error({ error: memberError }, 'Failed to create membership after invite')
      return NextResponse.json({ error: 'Failed to create membership' }, { status: 500 })
    }

    // Log to audit trail
    await admin.from('audit_log').insert({
      actor_user_id: caller.id,
      action: 'member_invited',
      entity_type: 'organization_member',
      entity_id: member.id,
      details: {
        organization_id: parsed.data.organization_id,
        invited_email: parsed.data.email,
        role: parsed.data.role,
      },
    })

    return NextResponse.json({ member, invitationSent: true }, { status: 201 })
  } catch (error) {
    log.error({ error }, 'Error in POST members')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/organizations/members — update member status (revoke, reactivate).
 */
export async function PATCH(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (isAuthResponse(authRes)) return authRes
    const { user: caller } = authRes

    const body = await request.json()
    const { member_id, action: memberAction } = body as { member_id: string; action: string }

    if (!member_id || !memberAction) {
      return NextResponse.json({ error: 'member_id and action required' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Get the member record
    const { data: member } = await admin
      .from('organization_members')
      .select('*')
      .eq('id', member_id)
      .single()

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Verify caller has permission (titular or super_admin)
    const { data: org } = await admin
      .from('organizations')
      .select('owner_user_id')
      .eq('id', member.organization_id)
      .single()

    const isOwner = org?.owner_user_id === caller.id
    const isSuperAdmin = caller.role === 'super_admin'

    if (!isOwner && !isSuperAdmin) {
      // Check if caller is an admin of this org
      const { data: callerMembership } = await admin
        .from('organization_members')
        .select('role')
        .eq('organization_id', member.organization_id)
        .eq('user_id', caller.id)
        .eq('status', 'active')
        .single()

      if (callerMembership?.role !== 'admin' && callerMembership?.role !== 'titular') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Apply the action
    const updates: Record<string, unknown> = {}
    switch (memberAction) {
      case 'revoke':
        updates.status = 'revoked'
        break
      case 'reactivate':
        updates.status = 'active'
        updates.joined_at = new Date().toISOString()
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const { data: updated, error } = await admin
      .from('organization_members')
      .update(updates)
      .eq('id', member_id)
      .select()
      .single()

    if (error) {
      log.error({ error }, 'Failed to update member')
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ member: updated })
  } catch (error) {
    log.error({ error }, 'Error in PATCH members')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
