import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createPaymentLink, checkPaymentStatus } from '@/lib/bold-client'
import { createPayment, getPaymentByBoldLinkId, updatePayment } from '@/lib/db/queries/payments'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      amount,
      amountType,
      description,
      residentEmail,
      residentUnit,
      buildingId,
      buildingName,
      paymentType,
    } = body

    if (!description || !buildingId || !paymentType) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: description, buildingId, paymentType' },
        { status: 400 }
      )
    }

    const reference = `${buildingId}-${Date.now()}`

    const result = await createPaymentLink({
      amount: amount || 0,
      amountType: amountType || 'OPEN',
      description,
      reference,
      payerEmail: residentEmail,
    })

    const paymentId = crypto.randomUUID()
    
    await createPayment({
      id: paymentId,
      building_id: buildingId,
      building_name: buildingName || 'Edificio',
      amount: amount || 0,
      currency: 'COP',
      status: 'pending',
      type: paymentType,
      description,
      resident_unit: residentUnit || null,
      bold_link_id: result.boldLinkId,
      bold_url: result.url,
      amount_type: amountType || 'OPEN',
    })

    return NextResponse.json({
      success: true,
      boldLinkId: result.boldLinkId,
      url: result.url,
      paymentId,
    })
  } catch (error) {
    console.error('Error creating payment link:', error)
    return NextResponse.json(
      { error: 'Error al crear link de pago' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const boldLinkId = searchParams.get('boldLinkId')

    if (!boldLinkId) {
      return NextResponse.json({ error: 'boldLinkId requerido' }, { status: 400 })
    }

    const status = await checkPaymentStatus(boldLinkId)

    const existingPayment = await getPaymentByBoldLinkId(boldLinkId)

    if (existingPayment && status.status === 'PAID' && existingPayment.status !== 'succeeded') {
      await updatePayment(existingPayment.id, {
        status: 'succeeded',
        payment_method: status.paymentMethod,
        transaction_id: status.transactionId,
      })
    }

    return NextResponse.json({
      boldLinkId,
      status: status.status,
      amount: status.total,
      amountType: status.amountType,
      paymentMethod: status.paymentMethod,
      transactionId: status.transactionId,
      isSandbox: status.isSandbox,
    })
  } catch (error) {
    console.error('Error checking payment status:', error)
    return NextResponse.json(
      { error: 'Error al consultar estado del pago' },
      { status: 500 }
    )
  }
}