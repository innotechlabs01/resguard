import { NextResponse } from 'next/server'
import { randomInt } from 'node:crypto'
import { requireAuth } from '@/lib/auth/requireAuth'
import { getUsers, createUser, updateUser, deleteUser } from '@/lib/db/queries/users'
import { getSupabaseAdmin } from '@/lib/db/supabase'
import { validateBody, CreateUserSchema } from '@/lib/validation'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/users' })

export const dynamic = 'force-dynamic'

// Alphanumeric charset without ambiguous glyphs (0/O, 1/l/I) so the
// generated credential is easy to read aloud and hand over in person.
const PASSWORD_ALPHABET = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateTempPassword(length = 9): string {
  let password = ''
  for (let i = 0; i < length; i++) {
    password += PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)]
  }
  return password
}export async function GET(request: Request) {
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

    const admin = getSupabaseAdmin()
    if (!admin) {
      log.error('Supabase admin client not configured (DATABASE_URL_SUPABASE / DATABASE_SERVICES_SUPABASE)')
      return NextResponse.json({ error: 'User provisioning unavailable: server misconfigured' }, { status: 500 })
    }

    // Provision the Supabase Auth identity first: public.users.id MUST equal
    // auth.users.id (requireAuth looks the profile up by the auth id), and the
    // generated password is the only credential the new user will receive.
    const tempPassword = generateTempPassword()
    const { data: created, error: authError } = await admin.auth.admin.createUser({
      email: validation.data.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name: validation.data.name, role: targetRole },
    })

    if (authError || !created.user) {
      if (authError?.status === 422) {
        return NextResponse.json({ error: 'El correo ya está registrado' }, { status: 409 })
      }
      log.error({ error: authError }, 'Supabase Auth user creation failed')
      return NextResponse.json({ error: 'Failed to create auth user' }, { status: 500 })
    }

    try {
      await createUser({
        id: created.user.id,
        email: validation.data.email,
        name: validation.data.name,
        role: targetRole,
        building_id: finalBuildingId,
      })
    } catch (dbError) {
      // Rollback the auth user so no orphan account can log in without a profile
      log.error({ error: dbError }, 'public.users insert failed, rolling back auth user')
      await admin.auth.admin.deleteUser(created.user.id).catch(() => undefined)
      throw dbError
    }

    // tempPassword is returned once so the admin can hand it over; it is never logged.
    return NextResponse.json(
      { success: true, message: 'User created successfully', tempPassword },
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
