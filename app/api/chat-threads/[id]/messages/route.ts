import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { assertResourceBuilding } from '@/lib/auth/assertBuildingAccess'
import { getThreadById, getMessages, sendMessage, markAsRead } from '@/lib/db/queries/chat-threads'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/chat-threads/[id]/messages' })

/**
 * Fetches the thread and verifies building isolation.
 * Returns null if OK, or a NextResponse if access is denied / thread missing.
 */
async function getThreadWithAccess(
  user: { id: string; role: string; building_id: string | null },
  threadId: string
): Promise<{ thread: null; response: NextResponse } | { thread: { building_id: string | null; id: string; unit_number: string | null }; response: null }> {
  const thread = await getThreadById(threadId)
  if (!thread) {
    return { thread: null, response: NextResponse.json({ error: 'Thread not found' }, { status: 404 }) }
  }
  const access = assertResourceBuilding(user as never, thread.building_id)
  if (!access.ok) {
    return { thread: null, response: NextResponse.json({ error: access.error }, { status: access.status }) }
  }
  return { thread, response: null }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const { id: threadId } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const { response } = await getThreadWithAccess(user, threadId)
    if (response) return response

    const messages = await getMessages(threadId, limit)
    return NextResponse.json({ messages })
  } catch (error) {
    log.error({ error }, 'Error fetching messages')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const { id: threadId } = await params
    const { response } = await getThreadWithAccess(user, threadId)
    if (response) return response

    const body = await request.json()
    const { content } = body

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'content required' }, { status: 400 })
    }

    const message = await sendMessage({
      threadId,
      senderId: user.id,
      senderName: user.name || user.email,
      senderRole: user.role,
      content: content.trim(),
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    log.error({ error }, 'Error sending message')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const { id: threadId } = await params
    const { response } = await getThreadWithAccess(user, threadId)
    if (response) return response

    await markAsRead(threadId, user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    log.error({ error }, 'Error marking as read')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
