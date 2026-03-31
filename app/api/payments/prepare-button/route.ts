import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createPayment, getPaymentById, updatePayment } from '@/lib/db/queries/payments'
import { getBoldPublicKey, generateIntegrityHashServer } from '@/lib/bold-client'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      paymentId,
      amount,
      description,
      residentEmail,
      residentName,
      residentPhone,
    } = body

    if (!paymentId) {
      return NextResponse.json(
        { error: 'paymentId es requerido' },
        { status: 400 }
      )
    }

    const publicKey = getBoldPublicKey()
    if (!publicKey) {
      return NextResponse.json(
        { error: 'Bold public key no configurada' },
        { status: 500 })
    }

    const existingPayment = await getPaymentById(paymentId)
    
    const orderId = existingPayment?.bold_link_id || `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const currency = 'COP'
    const paymentAmount = amount || existingPayment?.amount || 0
    
    let hash = ''
    if (paymentAmount > 0) {
      hash = generateIntegrityHashServer(orderId, paymentAmount, currency)
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectUrl = `${baseUrl}/payments/result?paymentId=${paymentId}&orderId=${orderId}`

    const buttonConfig = {
      apiKey: publicKey,
      orderId: orderId,
      amount: paymentAmount,
      currency: currency,
      description: description || existingPayment?.description || 'Pago ResGuard',
      integritySignature: hash,
      redirectUrl: redirectUrl,
      customerData: residentEmail ? {
        email: residentEmail,
        fullName: residentName || '',
        phone: residentPhone || '',
        dialCode: '+57',
      } : undefined,
      renderMode: 'embedded',
    }

    if (!existingPayment) {
      await createPayment({
        id: paymentId,
        building_id: body.buildingId || 'unknown',
        building_name: body.buildingName || 'Edificio',
        amount: paymentAmount,
        currency: currency,
        status: 'pending',
        type: body.paymentType || 'subscription',
        description: description || 'Pago',
        resident_unit: body.residentUnit || null,
        bold_link_id: orderId,
        amount_type: paymentAmount > 0 ? 'CLOSE' : 'OPEN',
      })
    }

    return NextResponse.json({
      success: true,
      buttonConfig,
      paymentId,
    })
  } catch (error) {
    console.error('Error preparing payment button:', error)
    return NextResponse.json(
      { error: 'Error al preparar pago' },
      { status: 500 }
    )
  }
}