import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { assertBuildingAccess } from '@/lib/auth/assertBuildingAccess'
import { getConsumptionAlerts } from '@/lib/db/queries/utility'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/utility/alerts' })

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request)
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    if (!buildingId) {
      return NextResponse.json({ error: 'buildingId required' }, { status: 400 })
    }
    const access = assertBuildingAccess(user, buildingId)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const alerts = await getConsumptionAlerts(buildingId)
    return NextResponse.json({ alerts })
  } catch (error) {
    log.error({ error }, 'Error fetching consumption alerts')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
