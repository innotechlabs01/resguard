import { NextResponse } from 'next/server'
import { updatePayment, getPaymentByBoldLinkId } from '@/lib/db/queries/payments'
import { mapBoldStatusToApp } from '@/lib/bold-client'

interface BoldWebhookPayload {
  id: string
  status: string
  total: number
  payment_method: string | null
  transaction_id: string | null
  reference: string
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as BoldWebhookPayload
    
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
      console.log(`Webhook recibido para link no registrado: ${boldLinkId}`)
      return NextResponse.json({ message: 'Pago no encontrado' })
    }

    const appStatus = mapBoldStatusToApp(boldStatus)

    await updatePayment(existingPayment.id, {
      status: appStatus,
      payment_method: body.payment_method,
      transaction_id: body.transaction_id,
    })

    console.log(`Payment ${existingPayment.id} updated to ${appStatus} via webhook`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Error al procesar webhook' },
      { status: 500 }
    )
  }
}