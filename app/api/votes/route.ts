import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { insertVote, hasUserVotedOnItem } from '@/lib/db/queries/assemblies'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/votes' })

export const dynamic = 'force-dynamic'

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

    const resolvedUserId = userId ?? user.id
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
