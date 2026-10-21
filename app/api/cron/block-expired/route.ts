import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/db/supabase'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/cron/block-expired' })

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * POST /api/cron/block-expired
 *
 * Scheduled task that blocks subscriptions whose grace period has expired
 * without a confirmed payment. Idempotent: running it multiple times
 * produces the same result (subscriptions already blocked are skipped).
 *
 * Authentication: requires CRON_SECRET header (set in Vercel env).
 * In Vercel cron, this is automatically set via Authorization: Bearer ${CRON_SECRET}.
 *
 * Setup in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/block-expired",
 *     "schedule": "0 6 * * *"  // daily at 6:00 UTC (midnight Colombia)
 *   }]
 * }
 */
export async function POST(request: Request) {
  try {
    // Verify the cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      log.warn('Unauthorized cron call — missing or invalid secret')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // If no CRON_SECRET is set (dev/QA), allow but log a warning
    if (!cronSecret) {
      log.warn('CRON_SECRET not configured — running without authentication (dev mode)')
    }

    const admin = getSupabaseAdmin()
    if (!admin) {
      log.error('Supabase admin not configured')
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Step 1: Block subscriptions whose grace period has expired
    const { data: blockedData, error: blockedError } = await admin.rpc(
      'check_and_block_expired_subscriptions'
    )

    if (blockedError) {
      log.error({ error: blockedError }, 'Failed to block expired subscriptions')
      return NextResponse.json({ error: 'Failed to process' }, { status: 500 })
    }

    const blockedCount = Number(blockedData) || 0

    // Step 2: Move active subscriptions past their period_end into grace period
    // (unless they already have a grace_period_end set)
    const graceDate = new Date()
    graceDate.setDate(graceDate.getDate() + 5)

    const { data: graceData, error: graceError } = await admin
      .from('subscriptions')
      .update({
        status: 'past_due',
        grace_period_end: graceDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('status', 'active')
      .lt('current_period_end', new Date().toISOString())
      .is('grace_period_end', null)
      .neq('organization_id', 'null')
      .select('id')

    if (graceError) {
      log.error({ error: graceError }, 'Failed to update grace periods')
    }

    const graceCount = graceData?.length || 0

    // Step 3: Log the results to audit_log
    await admin.from('audit_log').insert({
      actor_user_id: null,
      action: 'cron_block_expired_subscriptions',
      entity_type: 'subscriptions',
      entity_id: null,
      details: {
        blocked: blockedCount,
        entered_grace: graceCount,
        executed_at: new Date().toISOString(),
      },
    })

    log.info({ blockedCount, graceCount }, 'Cron completed successfully')

    return NextResponse.json({
      ok: true,
      blocked: blockedCount,
      enteredGrace: graceCount,
      executedAt: new Date().toISOString(),
    })
  } catch (error) {
    log.error({ error }, 'Cron endpoint error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/cron/block-expired
 * Same as POST but usable via GET for manual testing or external schedulers.
 */
export async function GET(request: Request) {
  return POST(request)
}
