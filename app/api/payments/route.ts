import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getPayments } from '@/lib/db/queries/payments'

const hasClerk = Boolean(process.env.CLERK_SECRET_KEY?.trim())

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    if (hasClerk) {
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId') ?? undefined

    const payments = await getPayments(buildingId)
    
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
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
