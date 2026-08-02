import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getChatMessages } from '@/lib/db/queries/chat-messages'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/chat-messages' })

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
