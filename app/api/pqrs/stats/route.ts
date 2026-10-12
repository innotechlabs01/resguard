import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { assertBuildingAccess } from '@/lib/auth/assertBuildingAccess'
import { getPqrsStats } from '@/lib/db/queries/pqrs'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/pqrs/stats' })

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, ['admin', 'super_admin'])
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    if (!buildingId) {
      return NextResponse.json({ error: 'buildingId required' }, { status: 400 })
    }
    const access = assertBuildingAccess(user, buildingId)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const stats = await getPqrsStats(buildingId)
    return NextResponse.json({ stats })
  } catch (error) {
    log.error({ error }, 'Error fetching PQRS stats')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
