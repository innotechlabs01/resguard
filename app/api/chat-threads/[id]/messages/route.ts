import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { getMessages, sendMessage, markAsRead } from '@/lib/db/queries/chat-threads'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/chat-threads/[id]/messages' })

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (isAuthResponse(authResult)) return authResult

    const { id: threadId } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

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
    await markAsRead(threadId, user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    log.error({ error }, 'Error marking as read')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
