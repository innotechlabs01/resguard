import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { getPqrsById, getPqrsComments, updatePqrsStatus, assignPqrs } from '@/lib/db/queries/pqrs'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/pqrs/[id]' })

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (isAuthResponse(authResult)) return authResult

    const { id } = await params
    const pqrs = await getPqrsById(id)
    if (!pqrs) {
      return NextResponse.json({ error: 'PQRS not found' }, { status: 404 })
    }

    const comments = await getPqrsComments(id)
    return NextResponse.json({ pqrs, comments })
  } catch (error) {
    log.error({ error }, 'Error fetching PQRS detail')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request, ['admin', 'super_admin'])
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const { id } = await params
    const body = await request.json()
    const { status, assigned_to } = body

    if (status) {
      await updatePqrsStatus(id, status, user.name || user.email)
    }
    if (assigned_to !== undefined) {
      await assignPqrs(id, assigned_to)
    }

    const updated = await getPqrsById(id)
    return NextResponse.json({ pqrs: updated })
  } catch (error) {
    log.error({ error }, 'Error updating PQRS')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
