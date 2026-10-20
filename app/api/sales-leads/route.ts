import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/db/supabase'
import { requireAuth } from '@/lib/auth/requireAuth'
import { checkStrictRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/sales-leads' })

export const dynamic = 'force-dynamic'

const LeadSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email().max(320),
  phone: z.string().max(30).optional(),
  company_name: z.string().max(200).optional(),
  building_count: z.number().min(1).max(1000).default(1),
  unit_count: z.number().min(0).max(100000).optional(),
  interest: z.string().max(1000).optional(),
  message: z.string().max(2000).optional(),
  plan_interest: z.enum(['basico', 'profesional', 'corporativo', 'no_se']).default('no_se'),
})

/**
 * POST /api/sales-leads — PUBLIC (landing form).
 * Rate limited: 3 per hour per IP.
 */
export async function POST(request: Request) {
  try {
    const ip = getRateLimitIdentifier(request)
    const rl = await checkStrictRateLimit(`sales-lead:${ip}`, 3, '1 h')
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const body = await request.json()
    const parsed = LeadSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()
    if (!admin) {
      log.error('Supabase admin not configured')
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const { error } = await admin.from('sales_leads').insert({
      name: parsed.data.name,
      email: parsed.data.email.trim().toLowerCase(),
      phone: parsed.data.phone || null,
      company_name: parsed.data.company_name || null,
      building_count: parsed.data.building_count,
      unit_count: parsed.data.unit_count || null,
      interest: parsed.data.interest || null,
      message: parsed.data.message || null,
      plan_interest: parsed.data.plan_interest,
      source: 'landing',
    })

    if (error) {
      log.error({ error }, 'Failed to insert sales lead')
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json(
      { ok: true, message: 'Gracias. Te contactaremos pronto para agendar una demo.' },
      { status: 201 }
    )
  } catch (error) {
    log.error({ error }, 'Error in POST /api/sales-leads')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/sales-leads — super_admin only.
 */
export async function GET(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes
    const { user } = authRes

    if (user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = getSupabaseAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data, error } = await admin
      .from('sales_leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      log.error({ error }, 'Failed to fetch sales leads')
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ leads: data || [] })
  } catch (error) {
    log.error({ error }, 'Error in GET /api/sales-leads')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/sales-leads — super_admin updates lead status.
 */
export async function PATCH(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes
    const { user } = authRes

    if (user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id, status } = body as { id: string; status: string }

    const validStatuses = ['new', 'contacted', 'demo', 'negotiation', 'won', 'lost']
    if (!id || !status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'id and valid status required' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data, error } = await admin
      .from('sales_leads')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    return NextResponse.json({ lead: data })
  } catch (error) {
    log.error({ error }, 'Error in PATCH /api/sales-leads')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
