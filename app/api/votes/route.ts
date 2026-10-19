import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { insertVote, hasUserVotedOnItem, getAgendaItemBuildingId } from '@/lib/db/queries/assemblies'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/votes' })

export const dynamic = 'force-dynamic'

/**
 * R4 fix: verify the agenda item belongs to the caller's building.
 * Returns null if OK, or a NextResponse 403 if access is denied.
 */
async function checkAgendaItemAccess(
  user: { role: string; building_id: string | null },
  agendaItemId: string
): Promise<NextResponse | null> {
  if (user.role === 'super_admin') return null
  const itemBuildingId = await getAgendaItemBuildingId(agendaItemId)
  if (!itemBuildingId || itemBuildingId !== user.building_id) {
    return NextResponse.json(
      { error: 'Forbidden: agenda item not in your building' },
      { status: 403 }
    )
  }
  return null
}

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, ['usuario', 'admin', 'super_admin'])
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const { searchParams } = new URL(request.url)
    const agendaItemId = searchParams.get('agendaItemId')
    const userId = searchParams.get('userId')

    if (!agendaItemId) {
      return NextResponse.json({ error: 'agendaItemId required' }, { status: 400 })
    }

    // R4 fix: building isolation on vote reads
    const accessDenied = await checkAgendaItemAccess(user, agendaItemId)
    if (accessDenied) return accessDenied

    // R4 fix: userId param only allowed for admins checking their building's users
    const resolvedUserId = userId ?? user.id
    if (userId && userId !== user.id && user.role === 'usuario') {
      return NextResponse.json(
        { error: 'Forbidden: cannot check another user\'s vote' },
        { status: 403 }
      )
    }

    const hasVoted = await hasUserVotedOnItem(agendaItemId, resolvedUserId)
    return NextResponse.json({ hasVoted })
  } catch (error) {
    log.error({ error }, 'Error checking vote status')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, ['usuario', 'admin', 'super_admin'])
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const body = await request.json()
    const { agendaItemId, optionId, encryptedVote, voteHash } = body

    if (!agendaItemId || !optionId || !encryptedVote || !voteHash) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // R4 fix: building isolation on vote writes
    const accessDenied = await checkAgendaItemAccess(user, agendaItemId)
    if (accessDenied) return accessDenied

    const userId = user.id
    const alreadyVoted = await hasUserVotedOnItem(agendaItemId, userId)
    if (alreadyVoted) {
      return NextResponse.json({ error: 'You have already voted on this item' }, { status: 409 })
    }

    await insertVote({
      agenda_item_id: agendaItemId,
      user_id: userId,
      encrypted_vote: encryptedVote,
      vote_hash: voteHash,
      option_id: optionId,
    })

    return NextResponse.json({ message: 'Vote recorded successfully' })
  } catch (error) {
    log.error({ error }, 'Error recording vote')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
