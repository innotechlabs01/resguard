import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { assertBuildingAccessAsync } from '@/lib/auth/assertBuildingAccess'
import { getPayments, createPayment } from '@/lib/db/queries/payments'
import { getResidents } from '@/lib/db/queries/residents'
import { validateBody, CreatePaymentSchema } from '@/lib/validation'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/payments' })

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, ['usuario', 'admin', 'super_admin'])
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const body = await request.json()
    const validation = validateBody(CreatePaymentSchema, body)
    if (!validation.success) return validation.response

    const { amount, amountType, description, residentEmail, residentUnit, buildingId, buildingName, paymentType } = validation.data
    const access = await assertBuildingAccessAsync(user, buildingId)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    await createPayment({
      building_id: buildingId,
      building_name: buildingName || 'Edificio',
      amount,
      currency: 'COP',
      status: 'pending',
      type: paymentType,
      description,
      resident_unit: residentUnit || null,
      amount_type: amountType,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error({ error }, 'Error creating payment')
    return NextResponse.json({ error: 'Error al crear el cobro' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes

    const { searchParams } = new URL(request.url)
    const { user } = authRes
    const buildingIdParam = searchParams.get('buildingId') ?? undefined
    const unitParam = searchParams.get('unit')?.trim() || undefined

    let buildingId = buildingIdParam
    if (user.role === 'super_admin') {
      buildingId = buildingIdParam
    } else if (user.role === 'admin') {
      const targetBuildingId = buildingIdParam || user.building_id || undefined
      if (!targetBuildingId) {
        return NextResponse.json({ error: 'Forbidden: building scope required' }, { status: 403 })
      }
      const access = await assertBuildingAccessAsync(user, targetBuildingId)
      if (!access.ok) {
        return NextResponse.json({ error: access.error }, { status: access.status })
      }
      buildingId = targetBuildingId
    } else {
      if (!user.building_id) {
        return NextResponse.json({ error: 'Forbidden: building scope required' }, { status: 403 })
      }
      if (buildingIdParam && buildingIdParam !== user.building_id) {
        return NextResponse.json({ error: 'Forbidden: building mismatch' }, { status: 403 })
      }
      buildingId = user.building_id
    }

    let payments = await getPayments(buildingId)

    if (user.role === 'usuario') {
      let residentUnit = user.unit?.trim() || unitParam || null
      if (!residentUnit && buildingId) {
        try {
          const residents = await getResidents(buildingId)
          const match = residents.find(
            (r) =>
              (r.user_id && r.user_id === user.id) ||
              (r.email && r.email.toLowerCase() === user.email.toLowerCase())
          )
          if (match?.unit) {
            residentUnit = match.unit.trim()
          }
        } catch {
          // Non-critical fallback
        }
      }

      if (residentUnit) {
        const normalizedUnit = residentUnit.toLowerCase()
        payments = payments.filter(
          (p) => !p.resident_unit || p.resident_unit.trim().toLowerCase() === normalizedUnit
        )
      }
    } else if (unitParam) {
      const normalizedUnit = unitParam.toLowerCase()
      payments = payments.filter(
        (p) => p.resident_unit?.trim().toLowerCase() === normalizedUnit
      )
    }

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
