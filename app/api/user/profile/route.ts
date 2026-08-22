import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/user/profile' })

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request)
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult
    return NextResponse.json({ userId: user.clerk_user_id ?? user.id })
  } catch (error) {
    log.error({ error }, 'Error fetching user profile')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
