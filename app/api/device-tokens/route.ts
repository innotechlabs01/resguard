import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { getSupabaseAdmin } from '@/lib/db/supabase'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/device-tokens' })

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const organizationId = searchParams.get('organizationId')

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

    if (organizationId) {
      query = query.eq('organization_id', organizationId)
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

    const body = await request.json()
    const { token, userId, role, deviceType, organizationId } = body

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { error } = await supabase.from('device_tokens').upsert({
      token,
      user_id: userId || 'anonymous',
      role: role || 'resident',
      device_type: deviceType || 'unknown',
      organization_id: organizationId,
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

    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
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
