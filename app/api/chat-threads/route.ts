import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { getThreadsByBuilding, getThreadsByUnit, getOrCreateThread } from '@/lib/db/queries/chat-threads'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/chat-threads' })

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request)
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    if (!buildingId) {
      return NextResponse.json({ error: 'buildingId required' }, { status: 400 })
    }

    const isStaff = ['vigilante', 'admin', 'super_admin'].includes(user.role)

    let threads
    if (isStaff) {
      threads = await getThreadsByBuilding(buildingId)
    } else {
      // Resident: filter by their unit
      const unitNumber = searchParams.get('unitNumber')
      if (!unitNumber) {
        return NextResponse.json({ error: 'unitNumber required for residents' }, { status: 400 })
      }
      threads = await getThreadsByUnit(buildingId, unitNumber)
    }

    return NextResponse.json({ threads })
  } catch (error) {
    log.error({ error }, 'Error fetching chat threads')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request)
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const body = await request.json()
    const { buildingId, unitNumber, threadType, subject } = body

    if (!buildingId || !unitNumber || !threadType) {
      return NextResponse.json({ error: 'buildingId, unitNumber, and threadType required' }, { status: 400 })
    }

    if (!['vigilante', 'admin', 'ai'].includes(threadType)) {
      return NextResponse.json({ error: 'Invalid threadType' }, { status: 400 })
    }

    const thread = await getOrCreateThread(buildingId, unitNumber, threadType, subject)
    return NextResponse.json({ thread }, { status: 201 })
  } catch (error) {
    log.error({ error }, 'Error creating chat thread')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
