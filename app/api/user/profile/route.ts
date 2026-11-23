import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { updateUser, getUserById } from '@/lib/db/queries/users'
import { getSupabaseAdmin } from '@/lib/db/supabase'
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

    const admin = getSupabaseAdmin()
    let unit: string | null = (profile as unknown as Record<string, unknown>).unit as string | null ?? null
    let phone: string | null = (profile as unknown as Record<string, unknown>).phone as string | null ?? null

    if (admin && (!unit || !phone)) {
      const { data: userRow } = await admin
        .from('users')
        .select('unit, phone')
        .eq('id', user.id)
        .maybeSingle()
      if (userRow) {
        unit = unit || userRow.unit || null
        phone = phone || userRow.phone || null
      }
      if (!unit || !phone) {
        const { data: resRow } = await admin
          .from('residents')
          .select('unit, phone')
          .or(`user_id.eq.${user.id},email.eq.${profile.email}`)
          .limit(1)
          .maybeSingle()
        if (resRow) {
          unit = unit || resRow.unit || null
          phone = phone || resRow.phone || null
        }
      }
    }

    return NextResponse.json({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      building_id: profile.building_id,
      unit,
      phone,
    })
  } catch (error) {
    log.error({ error }, 'Error fetching user profile')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Self-service profile update: a user can update their own name, phone, and unit.
 * Role and building_id are NOT updatable here (privilege escalation guard:
 * the RLS trigger prevent_role_escalation also blocks these at DB level).
 */
export async function PUT(request: Request) {
  try {
    const authResult = await requireAuth(request)
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const body = await request.json()
    const { name, phone, unit } = body

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'name required (min 2 chars)' }, { status: 400 })
    }

    const userUpdates: Record<string, unknown> = { name: name.trim() }
    if (typeof phone === 'string') {
      userUpdates.phone = phone.trim()
    }
    if (
      typeof unit === 'string' &&
      unit.trim() &&
      (user.role === 'admin' || user.role === 'super_admin')
    ) {
      userUpdates.unit = unit.trim()
    }

    await updateUser(user.id, userUpdates)

    // Synchronize name/phone in residents if a row exists for this user_id or email
    const admin = getSupabaseAdmin()
    if (admin) {
      const residentUpdates: Record<string, unknown> = { name: name.trim() }
      if (typeof phone === 'string') {
        residentUpdates.phone = phone.trim()
      }

      const { data: byUid } = await admin
        .from('residents')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (byUid?.id) {
        await admin.from('residents').update(residentUpdates).eq('id', byUid.id)
      } else if (user.email) {
        const { data: byEmail } = await admin
          .from('residents')
          .select('id')
          .eq('email', user.email)
          .limit(1)
          .maybeSingle()
        if (byEmail?.id) {
          await admin
            .from('residents')
            .update({ ...residentUpdates, user_id: user.id })
            .eq('id', byEmail.id)
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Profile updated' })
  } catch (error) {
    log.error({ error }, 'Error updating profile')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
