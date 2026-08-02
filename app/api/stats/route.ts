import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSystemStats } from '@/lib/db/queries/stats'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/stats' })

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await getSystemStats()
    return NextResponse.json({ stats })
  } catch (error) {
    log.error({ error }, 'Error fetching system stats')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
