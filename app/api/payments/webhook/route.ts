import { NextResponse } from 'next/server'
import { updatePayment, getPaymentByBoldLinkId } from '@/lib/db/queries/payments'
import { mapBoldStatusToApp, verifyBoldSignature } from '@/lib/bold-client'
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

    const secretKey = process.env.BOLD_SECRET_KEY || process.env.BOLD_SECRET_KEY_TEST || ''

    if (!signature || !secretKey) {
      log.warn('Missing Bold webhook signature or secret')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    if (timestamp) {
      const ts = Number(timestamp)
      if (!Number.isNaN(ts)) {
        const now = Date.now()
        const tsMs = ts > 1e12 ? ts : ts > 1e10 ? ts / 1e6 : ts * 1000
        if (Math.abs(now - tsMs) > 5 * 60 * 1000) {
          return NextResponse.json({ error: 'Timestamp expired' }, { status: 401 })
        }
      }
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

    const { id: boldLinkId, status: boldStatus } = body.data

    const existingPayment = await getPaymentByBoldLinkId(boldLinkId)
    if (!existingPayment) {
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
