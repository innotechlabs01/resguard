import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/user/profile' })

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ userId })
  } catch (error) {
    log.error({ error }, 'Error fetching user profile')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
