import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { getUsers, createUser, updateUser, deleteUser } from '@/lib/db/queries/users'
import { getSupabaseAdmin } from '@/lib/db/supabase'
import { validateBody, CreateUserSchema } from '@/lib/validation'
import { checkStrictRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/users' })

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes

    const { user } = authRes

    // If user has no building_id and is not super_admin, deny global scope
    if (user.role !== 'super_admin' && !user.building_id) {
      return NextResponse.json({ error: 'Forbidden: building scope required' }, { status: 403 })
    }

    const users = await getUsers(user.role === 'super_admin' ? undefined : user.building_id!)
    const formattedUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      buildingId: u.building_id,
    }))
    return NextResponse.json(formattedUsers)
  } catch (error) {
    log.error({ error }, 'Error fetching users')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes
    const { user: caller } = authRes

    const body = await request.json()
    const validation = validateBody(CreateUserSchema, body)
    if (!validation.success) return validation.response

    const targetRole = validation.data.role
    const targetBuildingId = validation.data.building_id || null

    // N5 fix: authorization matrix derived from the CRM model (T-023 Phase 2.1)
    // and the confirmed business flows:
    //   super_admin → creates admin/vigilante/usuario in any building (and super_admin)
    //   admin       → creates ONLY usuario (residents) in their OWN building
    //   others      → cannot create anyone
    if (caller.role === 'super_admin') {
      // super_admin can create any role; building_id is validated by zod when present
    } else if (caller.role === 'admin') {
      if (targetRole !== 'usuario') {
        return NextResponse.json(
          { error: 'Forbidden: admin can only create residents' },
          { status: 403 }
        )
      }
      if (!caller.building_id) {
        return NextResponse.json({ error: 'Forbidden: no building scope' }, { status: 403 })
      }
      if (targetBuildingId && targetBuildingId !== caller.building_id) {
        return NextResponse.json({ error: 'Forbidden: building mismatch' }, { status: 403 })
      }
    } else {
      return NextResponse.json(
        { error: 'Forbidden: insufficient privileges to create users' },
        { status: 403 }
      )
    }

    // For admin callers, ALWAYS use their own building_id (never trust the client)
    const finalBuildingId = caller.role === 'super_admin'
      ? targetBuildingId
      : caller.building_id

    // M3 fix: rate limit user creation (20 per hour per admin)
    const rlId = getRateLimitIdentifier(request, caller.id)
    const rl = await checkStrictRateLimit(`users-create:${rlId}`, 20, '1 h')
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const admin = getSupabaseAdmin()
    if (!admin) {
      log.error('Supabase admin client not configured (DATABASE_URL_SUPABASE / DATABASE_SERVICES_SUPABASE)')
      return NextResponse.json({ error: 'User provisioning unavailable: server misconfigured' }, { status: 500 })
    }

    // Provision the Supabase Auth identity first: public.users.id MUST equal
    // auth.users.id (requireAuth looks the profile up by the auth id), and the
    // generated password is the only credential the new user will receive.
    // ─── Invitation flow: email link instead of temp password ───
    // The user receives a single-use, time-limited link (1h expiry).
    // They click it → verify identity → set their OWN password.
    // No plaintext password is ever transmitted through the admin.
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin

    const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      validation.data.email,
      {
        redirectTo: `${origin}/auth/confirm`,
        data: {
          name: validation.data.name,
          role: targetRole,
        },
      }
    )

    if (inviteError || !inviteData?.user) {
      if (inviteError?.status === 422 || inviteError?.message?.includes('already registered')) {
        return NextResponse.json({ error: 'El correo ya está registrado' }, { status: 409 })
      }
      log.error({ error: inviteError }, 'Supabase invite failed')
      return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 })
    }

    // The handle_new_user trigger creates the public.users profile with
    // role='usuario' and building_id=null. Update it with the actual
    // role and building the admin selected (service_role bypasses the
    // prevent_role_escalation trigger — it's exempted for trusted connections).
    try {
      await createUser({
        id: inviteData.user.id,
        email: validation.data.email,
        name: validation.data.name,
        role: targetRole,
        building_id: finalBuildingId,
      })
    } catch (dbError) {
      // The trigger already created a basic profile; try updating instead
      log.warn({ error: dbError }, 'Profile insert conflict, attempting update')
      const { error: updateError } = await admin
        .from('users')
        .update({ name: validation.data.name, role: targetRole, building_id: finalBuildingId })
        .eq('id', inviteData.user.id)
      if (updateError) {
        log.error({ error: updateError }, 'Failed to update user profile after invite')
        // Don't fail the request — the invite was sent; admin can edit the user
      }
    }

    // Invitation sent — no password to display (email link is the credential)
    return NextResponse.json(
      {
        success: true,
        message: 'Invitación enviada',
        invitationSent: true,
        email: validation.data.email,
      },
      { status: 201 }
    )
  } catch (error) {
    log.error({ error }, 'Error creating user')
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes
    const { user: caller } = authRes

    const body = await request.json()
    const { id, role, building_id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    if (caller.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const filtered: Record<string, unknown> = { ...updates }
    if (role !== undefined) filtered.role = role
    if (building_id !== undefined) filtered.building_id = building_id

    await updateUser(id, filtered)
    return NextResponse.json({ success: true, message: 'User updated successfully' })
  } catch (error) {
    log.error({ error }, 'Error updating user')
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes
    const { user: caller } = authRes

    if (caller.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // N6 fix: delete the Auth identity too, not just the profile row.
    // Without this, the account remains logueable with no profile (orphan).
    const admin = getSupabaseAdmin()
    if (admin) {
      const { error: authDeleteError } = await admin.auth.admin.deleteUser(id)
      if (authDeleteError) {
        log.error({ error: authDeleteError, userId: id }, 'Failed to delete Supabase Auth user')
        return NextResponse.json({ error: 'Failed to delete auth user' }, { status: 500 })
      }
    } else {
      log.warn('Supabase admin client not configured; deleting profile row only (auth user will be orphaned)')
    }

    await deleteUser(id)
    return NextResponse.json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    log.error({ error }, 'Error deleting user')
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
