import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { updateUser, getUserById } from '@/lib/db/queries/users'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/user/profile' })

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request)
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const profile = await getUserById(user.id)
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      building_id: profile.building_id,
    })
  } catch (error) {
    log.error({ error }, 'Error fetching user profile')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Self-service profile update: a user can update their own name and phone.
 * Role and building_id are NOT updatable here (privilege escalation guard:
 * the RLS trigger prevent_role_escalation also blocks these at DB level).
 */
export async function PUT(request: Request) {
  try {
    const authResult = await requireAuth(request)
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const body = await request.json()
    const { name } = body

    // Whitelist: only name is self-service updatable
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'name required (min 2 chars)' }, { status: 400 })
    }

    await updateUser(user.id, { name: name.trim() })

    return NextResponse.json({ success: true, message: 'Profile updated' })
  } catch (error) {
    log.error({ error }, 'Error updating profile')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
