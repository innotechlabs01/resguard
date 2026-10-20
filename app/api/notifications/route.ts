import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { getSupabaseAdmin } from '@/lib/db/supabase'
import { getUserById } from '@/lib/db/queries/users'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/notifications' })

export const dynamic = 'force-dynamic'

const ADMIN_ROLES = ['admin', 'super_admin']

/**
 * R2 fix: admin can only act on users within their own building.
 * A building check is performed against the target user's building_id.
 */
async function canActOnUser(
  caller: { id: string; role: string; building_id: string | null },
  targetUserId: string
): Promise<boolean> {
  if (caller.id === targetUserId) return true
  if (!ADMIN_ROLES.includes(caller.role)) return false
  if (caller.role === 'super_admin') return true
  // admin: target user must be in caller's building
  const target = await getUserById(targetUserId)
  if (!target) return false
  return target.building_id === caller.building_id
}

export async function GET(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes
    const { user } = authRes

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    if (!(await canActOnUser(user, userId))) {
      return NextResponse.json({ error: 'Forbidden: cannot read another user\'s notifications' }, { status: 403 })
    }

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data, error } = await supabase
      .from('app_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      log.error({ error }, 'Error fetching notifications')
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ notifications: data || [] })
  } catch (error) {
    log.error({ error }, 'Error fetching notifications')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes
    const { user } = authRes

    const body = await request.json()
    const { userId, title, body: notificationBody, type, data } = body

    if (!userId || !title || !notificationBody) {
      return NextResponse.json({ error: 'userId, title, and body required' }, { status: 400 })
    }

    if (!(await canActOnUser(user, userId))) {
      return NextResponse.json({ error: 'Forbidden: cannot send notifications to another user' }, { status: 403 })
    }

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { error } = await supabase.from('app_notifications').insert({
      user_id: userId,
      title,
      body: notificationBody,
      type: type || 'general',
      data: data ? JSON.stringify(data) : null,
      sent_at: new Date().toISOString(),
    })

    if (error) {
      log.error({ error }, 'Error creating notification')
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    log.error({ error }, 'Error creating notification')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes
    const { user } = authRes

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Verify notification ownership before marking read
    const { data: existing, error: fetchError } = await supabase
      .from('app_notifications')
      .select('id, user_id')
      .eq('id', id)
      .maybeSingle()

    if (fetchError) {
      log.error({ error: fetchError }, 'Error fetching notification')
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }
    if (!existing) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }
    if (!(await canActOnUser(user, existing.user_id))) {
      return NextResponse.json({ error: 'Forbidden: cannot modify another user\'s notification' }, { status: 403 })
    }

    const { error } = await supabase
      .from('app_notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      log.error({ error }, 'Error updating notification')
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error({ error }, 'Error updating notification')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
