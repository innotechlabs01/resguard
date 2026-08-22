import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { getPqrsComments, addPqrsComment } from '@/lib/db/queries/pqrs'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/pqrs/[id]/comments' })

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (isAuthResponse(authResult)) return authResult

    const { id } = await params
    const comments = await getPqrsComments(id)
    return NextResponse.json({ comments })
  } catch (error) {
    log.error({ error }, 'Error fetching PQRS comments')
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

    const { id } = await params
    const body = await request.json()
    const { content, is_internal } = body

    if (!content) {
      return NextResponse.json({ error: 'content required' }, { status: 400 })
    }

    const comment = await addPqrsComment({
      pqrs_id: id,
      author_id: user.id,
      author_name: user.name || user.email,
      author_role: user.role,
      content,
      is_internal: is_internal || false,
    })

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    log.error({ error }, 'Error adding PQRS comment')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
