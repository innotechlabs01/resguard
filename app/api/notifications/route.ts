import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabaseAdmin } from '@/lib/db/supabase'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/notifications' })

const hasClerk = Boolean(process.env.CLERK_SECRET_KEY?.trim())

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    if (hasClerk) {
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
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
    if (hasClerk) {
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await request.json()
    const { userId, title, body: notificationBody, type, data } = body

    if (!userId || !title || !notificationBody) {
      return NextResponse.json({ error: 'userId, title, and body required' }, { status: 400 })
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
    if (hasClerk) {
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
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
