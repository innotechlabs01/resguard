import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { getSupabaseAdmin } from '@/lib/db/supabase'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/device-tokens' })

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const authRes = await requireAuth(request, ['admin', 'super_admin'])
    if (isAuthResponse(authRes)) return authRes
    const { user } = authRes

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    let query = supabase
      .from('device_tokens')
      .select('token, user_id, role, device_type, is_active')
      .eq('is_active', true)

    if (role) {
      query = query.eq('role', role)
    }

    // R3 fix: non-super_admin admins can only see tokens for users in their building
    if (user.role !== 'super_admin' && user.building_id) {
      const { data: buildingUsers, error: usersError } = await supabase
        .from('users')
        .select('id')
        .eq('building_id', user.building_id)
      if (usersError) {
        log.error({ error: usersError }, 'Error fetching building users for token filter')
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }
      const userIds = (buildingUsers || []).map(u => u.id)
      if (userIds.length === 0) {
        return NextResponse.json({ tokens: [] })
      }
      query = query.in('user_id', userIds)
    }

    const { data, error } = await query

    if (error) {
      log.error({ error }, 'Error fetching device tokens')
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ tokens: data || [] })
  } catch (error) {
    log.error({ error }, 'Error fetching device tokens')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes
    const { user } = authRes

    const body = await request.json()
    const { token, role, deviceType } = body

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { error } = await supabase.from('device_tokens').upsert({
      token,
      user_id: user.id,
      role: role || 'resident',
      device_type: deviceType || 'unknown',
      is_active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'token' })

    if (error) {
      log.error({ error }, 'Error saving device token')
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error({ error }, 'Error saving device token')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes
    const { user } = authRes

    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // R3 fix: ownership check — non-super_admin can only deactivate THEIR OWN token
    if (user.role !== 'super_admin') {
      const { data: existing, error: checkError } = await supabase
        .from('device_tokens')
        .select('user_id')
        .eq('token', token)
        .single()
      if (checkError || !existing) {
        return NextResponse.json({ error: 'Token not found' }, { status: 404 })
      }
      if (existing.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Forbidden: cannot deactivate another user\'s token' },
          { status: 403 }
        )
      }
    }

    const { error } = await supabase
      .from('device_tokens')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('token', token)

    if (error) {
      log.error({ error }, 'Error deactivating device token')
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error({ error }, 'Error deactivating device token')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
