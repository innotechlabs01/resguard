import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { getSystemStats } from '@/lib/db/queries/stats'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/stats' })

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, ['admin', 'super_admin'])
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const stats = await getSystemStats()
    return NextResponse.json({ stats })
  } catch (error) {
    log.error({ error }, 'Error fetching system stats')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
