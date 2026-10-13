import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/db/supabase'
import { checkRateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

const WaitlistSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  source: z.string().trim().max(50).optional().default('landing'),
})

// Uniform success payload: duplicates and new inserts return the exact same
// body/status so the endpoint cannot be used to enumerate leads.
const SUCCESS_BODY = { ok: true, message: 'Gracias, te contactaremos pronto.' }

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const { success } = await checkRateLimit(`waitlist:${ip}`)
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests, please try again later.' },
        { status: 429 },
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const parsed = WaitlistSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      logger.error('Waitlist: Supabase admin client not configured')
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const { error } = await supabase
      .from('waitlist_leads')
      .insert({ email: parsed.data.email, source: parsed.data.source })

    // 23505 = unique_violation (email already on the list). Treat as success
    // to keep responses identical (anti-enumeration).
    if (error && error.code !== '23505') {
      logger.error({ error: error.message }, 'Waitlist insert failed')
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    // NOTE: confirmation email is intentionally NOT sent yet — SMTP config is
    // pending (T-019-CONFIG). UI shows the success message only.
    return NextResponse.json(SUCCESS_BODY, { status: 201 })
  } catch (error: unknown) {
    logger.error({ error: (error as Error)?.message }, 'Waitlist route error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
