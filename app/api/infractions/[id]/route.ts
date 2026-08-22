import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { getInfractionById, getInfractionEvidences, notifyInfractor, submitReply, decideInfraction } from '@/lib/db/queries/infractions'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/infractions/[id]' })

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (isAuthResponse(authResult)) return authResult

    const { id } = await params
    const infraction = await getInfractionById(id)
    if (!infraction) {
      return NextResponse.json({ error: 'Infraction not found' }, { status: 404 })
    }

    const evidences = await getInfractionEvidences(id)
    return NextResponse.json({ infraction, evidences })
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
    const body = await request.json()
    const { action, reply, decision, notes, fine_amount } = body

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
