import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { getSupabaseAdmin } from '@/lib/db/supabase'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/tenant-payments' })

export const dynamic = 'force-dynamic'

// Registrar pago de alquiler
export async function POST(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes

    const body = await request.json()
    const { tenantId, paymentDate, notes } = body

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { error } = await supabase
      .from('tenants')
      .update({
        last_payment_date: paymentDate || new Date().toISOString().split('T')[0],
        payment_notes: notes || null,
      })
      .eq('id', tenantId)

    if (error) {
      log.error({ error }, 'Error updating tenant payment')
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Payment registered' })
  } catch (error) {
    log.error({ error }, 'Error registering tenant payment')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
