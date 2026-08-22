import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { getConsumptionAlerts } from '@/lib/db/queries/utility'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/utility/alerts' })

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request)
    if (isAuthResponse(authResult)) return authResult

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    if (!buildingId) {
      return NextResponse.json({ error: 'buildingId required' }, { status: 400 })
    }

    const alerts = await getConsumptionAlerts(buildingId)
    return NextResponse.json({ alerts })
  } catch (error) {
    log.error({ error }, 'Error fetching consumption alerts')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
