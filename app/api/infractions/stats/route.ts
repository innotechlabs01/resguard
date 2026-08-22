import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { getInfractionStats } from '@/lib/db/queries/infractions'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/infractions/stats' })

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, ['admin', 'super_admin'])
    if (isAuthResponse(authResult)) return authResult

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    if (!buildingId) {
      return NextResponse.json({ error: 'buildingId required' }, { status: 400 })
    }

    const stats = await getInfractionStats(buildingId)
    return NextResponse.json({ stats })
  } catch (error) {
    log.error({ error }, 'Error fetching infraction stats')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
