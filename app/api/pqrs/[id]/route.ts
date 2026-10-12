import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { getPqrsById, getPqrsComments, updatePqrsStatus, assignPqrs } from '@/lib/db/queries/pqrs'
import { createAlert } from '@/lib/db/queries/alerts'
import { getTicketEvents } from '@/lib/db/queries/ticket-events'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/pqrs/[id]' })

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const { id } = await params
    const pqrs = await getPqrsById(id)
    if (!pqrs) {
      return NextResponse.json({ error: 'PQRS not found' }, { status: 404 })
    }
    if (user.role !== 'super_admin' && pqrs.building_id !== user.building_id) {
      return NextResponse.json({ error: 'Forbidden: building mismatch' }, { status: 403 })
    }

    const [comments, events] = await Promise.all([
      getPqrsComments(id),
      getTicketEvents('pqrs', id),
    ])
    return NextResponse.json({ pqrs, comments, events })
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
    if (updated && user.role !== 'super_admin' && updated.building_id !== user.building_id) {
      return NextResponse.json({ error: 'Forbidden: building mismatch' }, { status: 403 })
    }

    // Notify when a PQRS is resolved (fire-and-forget — never block the main flow)
    if (status === 'resolved' && updated) {
      try {
        await createAlert({
          building_id: updated.building_id,
          type: 'pqrs_resolved',
          title: 'PQRS resuelta: ' + updated.subject,
          message: 'Resuelta por ' + (user.name || user.email),
          priority: 'low',
          read: false,
          action_required: false,
          related_id: id,
        })
      } catch (alertErr) {
        log.error({ error: alertErr }, 'Failed to create resolved alert')
      }
    }

    return NextResponse.json({ pqrs: updated })
  } catch (error) {
    log.error({ error }, 'Error updating PQRS')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
