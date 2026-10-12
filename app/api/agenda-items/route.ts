import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { assertBuildingAccess } from '@/lib/auth/assertBuildingAccess'
import { getAgendaItems, createAgendaItem, getVotesForItem, getAssemblyById, type DbAgendaItem } from '@/lib/db/queries/assemblies'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/agenda-items' })

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, ['admin', 'super_admin'])
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const { searchParams } = new URL(request.url)
    const assemblyId = searchParams.get('assemblyId')
    if (!assemblyId) {
      return NextResponse.json({ error: 'assemblyId required' }, { status: 400 })
    }

    const assembly = await getAssemblyById(assemblyId)
    if (!assembly) {
      return NextResponse.json({ error: 'Assembly not found' }, { status: 404 })
    }
    const access = assertBuildingAccess(user, assembly.building_id)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const items = await getAgendaItems(assemblyId)
    const enriched = await Promise.all(
      items.map(async (item) => {
        const votes = await getVotesForItem(item.id)
        const voteCounts: Record<string, number> = {}
        let totalVotes = 0
        for (const vote of votes) {
          if (vote.option_id) {
            voteCounts[vote.option_id] = (voteCounts[vote.option_id] ?? 0) + 1
          }
          totalVotes += 1
        }
        return { ...item, voteCounts, totalVotes }
      })
    )

    return NextResponse.json({ agendaItems: enriched })
  } catch (error) {
    log.error({ error }, 'Error fetching agenda items')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, ['admin', 'super_admin'])
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const body = await request.json()
    const { assemblyId, title, description, voteType, options } = body

    if (!assemblyId || !title || !voteType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['yes_no', 'multiple_choice'].includes(voteType)) {
      return NextResponse.json({ error: 'Invalid voteType' }, { status: 400 })
    }

    if (!Array.isArray(options) || options.length < 2) {
      return NextResponse.json({ error: 'At least 2 options required' }, { status: 400 })
    }

    const validatedOptions = options.map((o, i) => ({
      id: typeof o?.id === 'string' && o.id !== '' ? o.id : String(i + 1),
      label: typeof o?.label === 'string' ? o.label : '',
    }))

    if (validatedOptions.some((o) => o.label.trim() === '')) {
      return NextResponse.json({ error: 'Each option must have a label' }, { status: 400 })
    }

    const assembly = await getAssemblyById(assemblyId)
    if (!assembly) {
      return NextResponse.json({ error: 'Assembly not found' }, { status: 404 })
    }
    const access = assertBuildingAccess(user, assembly.building_id)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const item = await createAgendaItem({
      assembly_id: assemblyId,
      title,
      description: description || '',
      vote_type: voteType,
      options: validatedOptions,
    })

    return NextResponse.json({ id: item.id, message: 'Agenda item created successfully' })
  } catch (error) {
    log.error({ error }, 'Error creating agenda item')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
