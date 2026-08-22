import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { getChatMessages } from '@/lib/db/queries/chat-messages'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/chat-messages' })

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, ['usuario', 'admin', 'vigilante'])
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    if (!buildingId) {
      return NextResponse.json({ error: 'buildingId required' }, { status: 400 })
    }

    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const messages = await getChatMessages(buildingId, limit)
    return NextResponse.json({ messages })
  } catch (error) {
    log.error({ error }, 'Error fetching chat messages')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
