import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { assertResourceBuilding } from '@/lib/auth/assertBuildingAccess'
import { getInfractionById, getInfractionEvidences, insertInfractionEvidence, notifyInfractor, submitReply, decideInfraction } from '@/lib/db/queries/infractions'
import { getTicketEvents } from '@/lib/db/queries/ticket-events'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/infractions/[id]' })

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const { id } = await params
    const infraction = await getInfractionById(id)
    if (!infraction) {
      return NextResponse.json({ error: 'Infraction not found' }, { status: 404 })
    }

    // Building isolation: infraction must belong to caller's building
    const access = assertResourceBuilding(user, infraction.building_id)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const [evidences, events] = await Promise.all([
      getInfractionEvidences(id),
      getTicketEvents('infraction', id),
    ])
    return NextResponse.json({ infraction, evidences, events })
  } catch (error) {
    log.error({ error }, 'Error fetching infraction detail')
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

    const { id } = await params
    const infraction = await getInfractionById(id)
    if (!infraction) {
      return NextResponse.json({ error: 'Infraction not found' }, { status: 404 })
    }

    // Building isolation: infraction must belong to caller's building
    const access = assertResourceBuilding(user, infraction.building_id)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const body = await request.json()
    const { action, reply, decision, notes, fine_amount, type, url } = body

    switch (action) {
      case 'notify': {
        // Only admin can notify
        if (user.role !== 'admin' && user.role !== 'super_admin') {
          return NextResponse.json({ error: 'Admin only' }, { status: 403 })
        }
        await notifyInfractor(id)
        break
      }
      case 'reply': {
        if (!reply) {
          return NextResponse.json({ error: 'reply required' }, { status: 400 })
        }
        await submitReply(id, reply)
        break
      }
      case 'decide': {
        if (user.role !== 'admin' && user.role !== 'super_admin') {
          return NextResponse.json({ error: 'Admin only' }, { status: 403 })
        }
        if (!decision || !notes) {
          return NextResponse.json({ error: 'decision and notes required' }, { status: 400 })
        }
        await decideInfraction(id, decision, notes, user.name || user.email, fine_amount)
        break
      }
      case 'upload_evidence': {
        if (!['photo', 'audio', 'document'].includes(type)) {
          return NextResponse.json({ error: 'type required' }, { status: 400 })
        }
        if (typeof url !== 'string' || !url.trim()) {
          return NextResponse.json({ error: 'url required' }, { status: 400 })
        }
        await insertInfractionEvidence({ infraction_id: id, type, url, uploaded_by: user.id })
        const [updated, evidences] = await Promise.all([
          getInfractionById(id),
          getInfractionEvidences(id),
        ])
        return NextResponse.json({ infraction: updated, evidences })
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const updated = await getInfractionById(id)
    return NextResponse.json({ infraction: updated })
  } catch (error) {
    log.error({ error }, 'Error updating infraction')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
