import { NextResponse } from 'next/server'
import { updatePayment, getPaymentById } from '@/lib/db/queries/payments'
import { getSupabaseAdmin } from '@/lib/db/supabase'
import { requireAuth } from '@/lib/auth/requireAuth'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/payments/update-status' })
const StatusEnum = z.enum(['succeeded', 'pending', 'failed', 'refunded'])

export async function POST(request: Request) {
  try {
    const authRes = await requireAuth(request, ['admin', 'super_admin'])
    if (authRes instanceof Response) return authRes
    const { user } = authRes

    const body = await request.json()
    const parsed = z.object({ paymentId: z.string().min(1), status: StatusEnum }).safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'paymentId y status son requeridos', details: parsed.error.flatten() }, { status: 400 })
    }
    const { paymentId, status } = parsed.data

    const payment = await getPaymentById(paymentId)
    if (!payment) return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })

    if (user.role !== 'super_admin' && payment.building_id !== user.building_id) {
      return NextResponse.json({ error: 'Forbidden: building mismatch' }, { status: 403 })
    }

    const prevStatus = payment.status
    await updatePayment(paymentId, { status })

    const supa = getSupabaseAdmin()
    if (supa) {
      await supa.from('payment_audits').insert({
        id: crypto.randomUUID(),
        payment_id: paymentId,
        clerk_user_id: user.clerk_user_id,
        prev_status: prevStatus,
        new_status: status,
        created_at: new Date().toISOString(),
      } as never)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error({ error }, 'Error updating payment status')
    return NextResponse.json({ error: 'Error al actualizar estado del pago' }, { status: 500 })
  }
}
