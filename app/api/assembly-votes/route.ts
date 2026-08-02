import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getAssemblyVotes, createAssemblyVote, updateVoteStatus, getVoteById, getVoteResponses, castVote, hasUserVoted } from '@/lib/db/queries/assemblies'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/assembly-votes' })

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const assemblyId = searchParams.get('assemblyId')
    const voteId = searchParams.get('voteId')

    if (assemblyId) {
      const votes = await getAssemblyVotes(assemblyId)
      return NextResponse.json({ votes })
    }

    if (voteId) {
      const vote = await getVoteById(voteId)
      const responses = await getVoteResponses(voteId)
      const hasVoted = await hasUserVoted(voteId, userId)
      return NextResponse.json({ vote, responses, hasVoted })
    }

    return NextResponse.json({ error: 'assemblyId or voteId required' }, { status: 400 })
  } catch (error) {
    log.error({ error }, 'Error fetching votes')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { assemblyId, title, description, options, status, userName, unit, optionId, voteId } = body

    if (voteId && userName && optionId && unit) {
      const alreadyVoted = await hasUserVoted(voteId, userId)
      if (alreadyVoted) {
        return NextResponse.json({ error: 'You have already voted' }, { status: 400 })
      }

      await castVote({
        vote_id: voteId,
        user_id: userId,
        user_name: userName,
        unit,
        option_id: optionId,
      })

      return NextResponse.json({ message: 'Vote recorded successfully' })
    }

    if (!assemblyId || !title || !options) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const id = await createAssemblyVote({
      assembly_id: assemblyId,
      title,
      description: description || '',
      options: JSON.stringify(options),
      status: status || 'pending',
      created_by: userId,
    })

    return NextResponse.json({ id, message: 'Vote created successfully' })
  } catch (error) {
    log.error({ error }, 'Error processing vote')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { voteId, assemblyId, status } = body

    if (voteId && status) {
      await updateVoteStatus(voteId, status)
      return NextResponse.json({ message: 'Vote status updated' })
    }

    if (assemblyId && status) {
      const { updateAssemblyStatus } = await import('@/lib/db/queries/assemblies')
      await updateAssemblyStatus(assemblyId, status)
      return NextResponse.json({ message: 'Assembly status updated' })
    }

    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  } catch (error) {
    log.error({ error }, 'Error updating status')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}