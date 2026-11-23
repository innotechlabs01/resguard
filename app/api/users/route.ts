import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { assertBuildingAccessAsync, getAdminOrganizationIds } from '@/lib/auth/assertBuildingAccess'
import { getUsers, getUserById, createUser, updateUser, deleteUser } from '@/lib/db/queries/users'
import { getBuildingsByOrganization } from '@/lib/db/queries/buildings'
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
    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')

    if (user.role !== 'super_admin' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let users
    if (user.role === 'super_admin') {
      users = await getUsers(buildingId || undefined)
    } else if (buildingId) {
      const access = await assertBuildingAccessAsync(user, buildingId)
      if (!access.ok) {
        return NextResponse.json({ error: access.error }, { status: access.status })
      }
      users = await getUsers(buildingId)
    } else {
      const orgIds = await getAdminOrganizationIds(user)
      const buildingLists = await Promise.all(orgIds.map((oid) => getBuildingsByOrganization(oid)))
      const buildingIds = new Set<string>(buildingLists.flat().map((b) => b.id))
      if (user.building_id) buildingIds.add(user.building_id)

      if (buildingIds.size === 0) {
        return NextResponse.json([])
      }
      const userLists = await Promise.all(Array.from(buildingIds).map((bid) => getUsers(bid)))
      const unique = new Map<string, typeof userLists[0][0]>()
      for (const list of userLists) {
        for (const u of list) unique.set(u.id, u)
      }
      users = Array.from(unique.values())
    }

    const formattedUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      buildingId: u.building_id,
      organizationId: u.organization_id,
      unit: u.unit ?? null,
      phone: u.phone ?? null,
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

    // Authorization matrix:
    //   super_admin → creates any role in any building/org
    //   admin       → creates ONLY usuario or vigilante inside their own building(s)/org
    //   others      → cannot create anyone
    let finalBuildingId: string | null = targetBuildingId
    if (caller.role === 'super_admin') {
      finalBuildingId = targetBuildingId
    } else if (caller.role === 'admin') {
      if (targetRole !== 'usuario' && targetRole !== 'vigilante') {
        return NextResponse.json(
          { error: 'Forbidden: admin can only create residents or guards' },
          { status: 403 }
        )
      }
      const requestedBuilding = targetBuildingId || caller.building_id
      if (!requestedBuilding) {
        return NextResponse.json(
          { error: 'Debes crear o seleccionar un edificio primero' },
          { status: 400 }
        )
      }
      const access = await assertBuildingAccessAsync(caller, requestedBuilding)
      if (!access.ok) {
        return NextResponse.json({ error: access.error }, { status: access.status })
      }
      finalBuildingId = requestedBuilding
    } else {
      return NextResponse.json(
        { error: 'Forbidden: insufficient privileges to create users' },
        { status: 403 }
      )
    }

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

    // Resolve organization_id:
    // - If super_admin creates an admin with organization_name, create the org + titular membership
    // - If super_admin passes organization_id, link it
    // - If admin creates a resident/guard, inherit caller's organization_id
    let finalOrganizationId: string | null =
      caller.role === 'super_admin'
        ? (validation.data.organization_id ?? null)
        : (caller.organization_id ?? null)

    if (
      caller.role === 'super_admin' &&
      targetRole === 'admin' &&
      !finalOrganizationId
    ) {
      const orgName =
        validation.data.organization_name?.trim() ||
        `Administración ${validation.data.name}`
      try {
        const { data: newOrg, error: orgErr } = await admin
          .from('organizations')
          .insert({
            name: orgName,
            type: validation.data.organization_type || 'hogar',
            owner_user_id: inviteData.user.id,
            created_by_user_id: caller.id,
            contact_email: validation.data.email,
          })
          .select('id')
          .single()
        if (!orgErr && newOrg?.id) {
          finalOrganizationId = newOrg.id
        }
      } catch (orgCreateErr) {
        log.warn({ error: orgCreateErr }, 'Non-critical error auto-creating organization')
      }
    }

    const userUnit = validation.data.unit ?? null
    const userPhone = validation.data.phone ?? null

    // The handle_new_user trigger creates the public.users profile with
    // role='usuario' and building_id=null. Update it with the actual
    // role, building and organization.
    try {
      await createUser({
        id: inviteData.user.id,
        email: validation.data.email,
        name: validation.data.name,
        role: targetRole,
        building_id: finalBuildingId,
        organization_id: finalOrganizationId,
        unit: userUnit,
        phone: userPhone,
      })
    } catch (dbError) {
      log.warn({ error: dbError }, 'Profile insert conflict, attempting update')
      const { error: updateError } = await admin
        .from('users')
        .update({
          name: validation.data.name,
          role: targetRole,
          building_id: finalBuildingId,
          organization_id: finalOrganizationId,
          unit: userUnit,
          phone: userPhone,
        })
        .eq('id', inviteData.user.id)
      if (updateError) {
        log.error({ error: updateError }, 'Failed to update user profile after invite')
      }
    }

    if (finalOrganizationId && (targetRole === 'admin' || targetRole === 'usuario')) {
      try {
        await admin
          .from('organization_members')
          .upsert(
            {
              organization_id: finalOrganizationId,
              user_id: inviteData.user.id,
              role: targetRole === 'admin' ? 'titular' : 'resident',
              status: 'active',
              invited_by_user_id: caller.id,
              joined_at: new Date().toISOString(),
            },
            { onConflict: 'organization_id,user_id' }
          )
      } catch (memberErr) {
        log.warn({ error: memberErr }, 'Non-critical error upserting organization member')
      }
    }

    if (targetRole === 'admin' && finalBuildingId && finalOrganizationId) {
      try {
        await admin
          .from('buildings')
          .update({ organization_id: finalOrganizationId })
          .eq('id', finalBuildingId)
          .is('organization_id', null)
      } catch (bldgOrgErr) {
        log.warn({ error: bldgOrgErr }, 'Non-critical error linking building to organization')
      }
    }

    if (finalBuildingId) {
      try {
        await admin
          .from('residents')
          .update({ user_id: inviteData.user.id })
          .eq('building_id', finalBuildingId)
          .ilike('email', validation.data.email.trim())
      } catch (resLinkErr) {
        log.warn({ error: resLinkErr }, 'Non-critical error linking resident user_id')
      }
    }

    // Invitation sent — no password to display (email link is the credential)
    return NextResponse.json(
      {
        success: true,
        message: 'Invitación enviada',
        invitationSent: true,
        userId: inviteData.user.id,
        email: validation.data.email,
        organizationId: finalOrganizationId,
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

    const targetUser = await getUserById(id)
    const effectiveRole = (filtered.role as string | undefined) ?? targetUser?.role
    const effectiveBuildingId =
      (filtered.building_id as string | null | undefined) ?? targetUser?.building_id ?? null
    const effectiveOrgId =
      (filtered.organization_id as string | null | undefined) ?? targetUser?.organization_id ?? null

    if (effectiveRole === 'admin' && effectiveBuildingId && effectiveOrgId) {
      const admin = getSupabaseAdmin()
      if (admin) {
        try {
          await admin
            .from('buildings')
            .update({ organization_id: effectiveOrgId })
            .eq('id', effectiveBuildingId)
            .is('organization_id', null)
        } catch (bldgOrgErr) {
          log.warn({ error: bldgOrgErr }, 'Non-critical error linking building to organization on PUT')
        }
      }
    }

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

    if (caller.role !== 'super_admin' && caller.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    if (caller.role === 'admin') {
      const targetUser = await getUserById(id)
      if (!targetUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      if (targetUser.role !== 'usuario' && targetUser.role !== 'vigilante') {
        return NextResponse.json({ error: 'Forbidden: cannot delete admin users' }, { status: 403 })
      }
      const access = await assertBuildingAccessAsync(caller, targetUser.building_id)
      if (!access.ok) {
        return NextResponse.json({ error: access.error }, { status: access.status })
      }
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
