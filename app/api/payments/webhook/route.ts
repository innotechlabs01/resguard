import { NextResponse } from 'next/server'
import { updatePayment, getPaymentByBoldLinkId } from '@/lib/db/queries/payments'
import { mapBoldStatusToApp } from '@/lib/bold-client'
import { createHash } from 'crypto'

import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/payments/webhook' })

interface BoldWebhookPayload {
  id: string
  status: string
  total: number
  payment_method: string | null
  transaction_id: string | null
  reference: string
}

function verifyBoldSignature(
  body: string,
  signature: string | null,
  secretKey: string
): boolean {
  if (!signature) return false
  const expectedHash = createHash('sha256').update(body + secretKey).digest('hex')
  return signature === expectedHash
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-bold-signature')

    const secretKey = process.env.BOLD_SECRET_KEY || process.env.BOLD_SECRET_KEY_TEST
    if (secretKey) {
      const isValid = verifyBoldSignature(rawBody, signature, secretKey)
      if (!isValid) {
        log.warn('Invalid Bold webhook signature')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    }

    const body = JSON.parse(rawBody) as BoldWebhookPayload
    const boldLinkId = body.id
    const boldStatus = body.status

    if (!boldLinkId || !boldStatus) {
      return NextResponse.json(
        { error: 'Datos de webhook incompletos' },
        { status: 400 }
      )
    }

    const existingPayment = await getPaymentByBoldLinkId(boldLinkId)

    if (!existingPayment) {
      return NextResponse.json({ message: 'Pago no encontrado' })
    }

    const appStatus = mapBoldStatusToApp(boldStatus)

    await updatePayment(existingPayment.id, {
      status: appStatus,
      payment_method: body.payment_method,
      transaction_id: body.transaction_id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error({ error }, 'Error processing webhook')
    return NextResponse.json(
      { error: 'Error al procesar webhook' },
      { status: 500 }
    )
  }
}
