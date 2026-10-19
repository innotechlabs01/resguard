import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { assertBuildingAccess } from '@/lib/auth/assertBuildingAccess'
import { validateBody } from '@/lib/validation'
import { logger } from '@/lib/logger'
import { createSubscriptionCheckout, BillingError } from '@/lib/billing/subscriptions'

const log = logger.child({ module: 'api/subscriptions/checkout' })

const CheckoutSchema = z.object({
  planCode: z.string().min(1).max(50),
  buildingId: z.string().uuid(),
  payerEmail: z.string().email().optional(),
})

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, ['admin', 'super_admin'])
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const body = await request.json()
    const validation = validateBody(CheckoutSchema, body)
    if (!validation.success) return validation.response

    const { planCode, buildingId, payerEmail } = validation.data

    const access = assertBuildingAccess(user, buildingId)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const result = await createSubscriptionCheckout({
      buildingId,
      planCode,
      payerEmail,
    })

    return NextResponse.json({
      success: true,
      checkoutUrl: result.checkoutUrl,
      boldLinkId: result.boldLinkId,
      subscriptionId: result.subscription.id,
      reference: result.reference,
    })
  } catch (error) {
    if (error instanceof BillingError) {
      if (error.code === 'plan_not_found') {
        return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })
      }
    }
    log.error({ error }, 'Error creando checkout de suscripción')
    return NextResponse.json(
      { error: 'Error al crear checkout' },
      { status: 500 }
    )
  }
}
