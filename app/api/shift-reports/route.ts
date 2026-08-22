import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { getShiftReports } from '@/lib/db/queries/shift-reports'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/shift-reports' })

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, ['vigilante', 'admin', 'super_admin'])
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    if (!buildingId) {
      return NextResponse.json({ error: 'buildingId required' }, { status: 400 })
    }

    const reports = await getShiftReports(buildingId)
    return NextResponse.json({ reports })
  } catch (error) {
    log.error({ error }, 'Error fetching shift reports')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
