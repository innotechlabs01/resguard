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

    // R-fix: system_stats is a global snapshot; only super_admin can read it.
    // Admins get a 403 (they have building-level panels, not platform stats).
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden: platform stats are super_admin only' },
        { status: 403 }
      )
    }

    const stats = await getSystemStats()
    return NextResponse.json({ stats })
  } catch (error) {
    log.error({ error }, 'Error fetching system stats')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
