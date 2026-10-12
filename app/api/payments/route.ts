import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { getPayments } from '@/lib/db/queries/payments'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/payments' })

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes

    const { searchParams } = new URL(request.url)
    const { user } = authRes
    const buildingIdParam = searchParams.get('buildingId') ?? undefined

    // If user has no building_id and is not super_admin, deny global scope
    if (user.role !== 'super_admin' && !user.building_id) {
      return NextResponse.json({ error: 'Forbidden: building scope required' }, { status: 403 })
    }

    let buildingId = buildingIdParam
    if (user.role !== 'super_admin') {
      buildingId = user.building_id!
    }

    if (buildingIdParam && buildingIdParam !== buildingId) {
      return NextResponse.json({ error: 'Forbidden: building mismatch' }, { status: 403 })
    }

    const payments = await getPayments(buildingId!)

    const formattedPayments = payments.map(p => ({
      id: p.id,
      buildingId: p.building_id,
      buildingName: p.building_name,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      type: p.type,
      description: p.description,
      residentUnit: p.resident_unit,
      createdAt: p.created_at,
      boldLinkId: p.bold_link_id,
      boldUrl: p.bold_url,
      amountType: p.amount_type,
      paymentMethod: p.payment_method,
      transactionId: p.transaction_id,
    }))

    return NextResponse.json({ payments: formattedPayments })
  } catch (error) {
    log.error({ error }, 'Error fetching payments')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
