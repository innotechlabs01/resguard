import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { getAssemblies, createAssembly, getAssemblyById, updateAssemblyStatus } from '@/lib/db/queries/assemblies'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/assemblies' })

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, ['admin', 'super_admin'])
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    if (!buildingId) {
      return NextResponse.json({ error: 'buildingId required' }, { status: 400 })
    }

    const assemblies = await getAssemblies(buildingId)
    return NextResponse.json({ assemblies })
  } catch (error) {
    log.error({ error }, 'Error fetching assemblies')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, ['admin', 'super_admin'])
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const body = await request.json()
    const { buildingId, title, description, date, time, location, sendNotification } = body

    if (!buildingId || !title || !date || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const id = await createAssembly({
      building_id: buildingId,
      title,
      description: description || '',
      date,
      time,
      location: location || '',
      status: 'scheduled',
      created_by: user.clerk_user_id ?? user.id,
    })

    return NextResponse.json({ id, message: 'Assembly created successfully' })
  } catch (error) {
    log.error({ error }, 'Error creating assembly')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}