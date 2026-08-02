import { NextResponse } from 'next/server'
import { updatePayment } from '@/lib/db/queries/payments'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/payments/update-status' })

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { paymentId, status } = body

    if (!paymentId || !status) {
      return NextResponse.json(
        { error: 'paymentId y status son requeridos' },
        { status: 400 }
      )
    }

    await updatePayment(paymentId, { status })

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error({ error }, 'Error updating payment status')
    return NextResponse.json(
      { error: 'Error al actualizar estado del pago' },
      { status: 500 }
    )
  }
}