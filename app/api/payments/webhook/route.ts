import { NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { updatePayment, getPaymentByBoldLinkId } from '@/lib/db/queries/payments'
import { getBoldWebhookSecret, mapBoldStatusToApp, verifyBoldSignature, parseSubscriptionReference } from '@/lib/bold-client'
import {
  activateSubscription,
  getSubscriptionById,
  markSubscriptionPastDue,
} from '@/lib/billing/subscriptions'
import { getSupabaseAdmin } from '@/lib/db/supabase'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/payments/webhook' })

const BoldStatusEnum = z.enum(['ACTIVE', 'PROCESSING', 'PAID', 'REJECTED', 'CANCELLED', 'EXPIRED'])
const WebhookSchema = z.object({
  id: z.string().min(1),
  status: BoldStatusEnum,
  total: z.number().optional(),
  payment_method: z.string().nullable().optional(),
  transaction_id: z.string().nullable().optional(),
  reference: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-bold-signature')
    const timestamp = request.headers.get('x-bold-timestamp')

    // ─── M2 FIX 1: use scope-aware secret; hard-fail in PRODUCTION ───
    const secretKey = getBoldWebhookSecret()
    const isProduction = process.env.APP_SCOPE === 'PRODUCTION'

    if (!signature || !secretKey) {
      log.warn('Missing Bold webhook signature or secret')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // In production, NEVER accept if the production secret is missing
    // (getBoldWebhookSecret returns '' when APP_SCOPE=PRODUCTION and
    // BOLD_SECRET_KEY is unset — that's a config error, not a fallback case)
    if (isProduction && !process.env.BOLD_SECRET_KEY) {
      log.error('BOLD_SECRET_KEY missing in PRODUCTION — rejecting webhook (no test-key fallback)')
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
    }

    // ─── M2 FIX 2: timestamp is MANDATORY, not optional ───
    if (!timestamp) {
      log.warn('Bold webhook missing x-bold-timestamp header')
      return NextResponse.json({ error: 'Missing timestamp' }, { status: 401 })
    }
    const ts = Number(timestamp)
    if (Number.isNaN(ts) || ts <= 0) {
      return NextResponse.json({ error: 'Invalid timestamp' }, { status: 401 })
    }
    const now = Date.now()
    const tsMs = ts > 1e12 ? ts : ts > 1e10 ? ts / 1e6 : ts * 1000
    if (Math.abs(now - tsMs) > 5 * 60 * 1000) {
      log.warn({ tsMs, now }, 'Bold webhook timestamp outside 5min window')
      return NextResponse.json({ error: 'Timestamp expired' }, { status: 401 })
    }

    if (!verifyBoldSignature(rawBody, signature, secretKey)) {
      log.warn('Invalid Bold webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const body = WebhookSchema.safeParse(parsed)
    if (!body.success) {
      return NextResponse.json({ error: 'Datos de webhook incompletos', details: body.error.flatten() }, { status: 400 })
    }

    const { id: boldLinkId, status: boldStatus, reference } = body.data

    // ─── M2 FIX 3: idempotency via event hash (anti-replay) ───
    const eventHash = createHash('sha256').update(rawBody).digest('hex')
    const admin = getSupabaseAdmin()
    if (admin) {
      const { data: existingEvent } = await admin
        .from('bold_webhook_events')
        .select('id')
        .eq('event_hash', eventHash)
        .single()

      if (existingEvent) {
        log.info({ eventHash: eventHash.slice(0, 8) }, 'Bold webhook replay detected — skipping')
        return NextResponse.json({ success: true, message: 'Event already processed' })
      }

      // Store the event before processing (at-most-once semantics)
      await admin.from('bold_webhook_events').insert({
        event_hash: eventHash,
        bold_link_id: boldLinkId,
        status: boldStatus,
        payload: parsed,
      })
    } else {
      log.warn('Supabase admin not configured — webhook idempotency check skipped')
    }

    const existingPayment = await getPaymentByBoldLinkId(boldLinkId)
    if (!existingPayment) {
      // No es pago puntual → revisar si es suscripción.
      const subRef = parseSubscriptionReference(reference)
      if (subRef) {
        const subscription = await getSubscriptionById(subRef.subscriptionId)
        if (subscription) {
          switch (boldStatus) {
            case 'PAID': {
              // Guard: solo activa si NO está ya activa (idempotencia por estado)
              if (subscription.status === 'active') {
                return NextResponse.json({ success: true, action: 'already_active' })
              }
              await activateSubscription(subRef.subscriptionId, { actor: 'bold_webhook' })
              return NextResponse.json({
                success: true,
                action: 'subscription_activated',
              })
            }
            case 'REJECTED':
            case 'EXPIRED':
            case 'CANCELLED': {
              if (subscription.status === 'active') {
                await markSubscriptionPastDue(subRef.subscriptionId)
                return NextResponse.json({ success: true, action: 'subscription_past_due' })
              }
              return NextResponse.json({ success: true, action: 'subscription_ignored' })
            }
            default:
              // PROCESSING / ACTIVE → sin efecto
              return NextResponse.json({ success: true, action: 'pending' })
          }
        }
      }
      return NextResponse.json({ message: 'Pago no encontrado' })
    }

    const appStatus = mapBoldStatusToApp(boldStatus)
    if (existingPayment.status === appStatus) {
      return NextResponse.json({ success: true, message: 'Already up to date' })
    }

    await updatePayment(existingPayment.id, {
      status: appStatus,
      payment_method: body.data.payment_method ?? null,
      transaction_id: body.data.transaction_id ?? null,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error({ error }, 'Error processing webhook')
    return NextResponse.json({ error: 'Error al procesar webhook' }, { status: 500 })
  }
}
