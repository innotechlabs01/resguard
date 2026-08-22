import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { logger } from '@/lib/logger'
import { validateBody, CreateBuildingSchema } from '@/lib/validation'

const log = logger.child({ module: 'api/buildings' })

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('id')

    return NextResponse.json({ buildings: [] })
  } catch (error) {
    log.error({ error }, 'Error fetching buildings')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes

    const body = await request.json()
    const validation = validateBody(CreateBuildingSchema, body)
    if (!validation.success) return validation.response

    return NextResponse.json({ success: true, message: 'Building created successfully' }, { status: 201 })
  } catch (error) {
    log.error({ error }, 'Error creating building')
    return NextResponse.json({ error: 'Failed to create building' }, { status: 500 })
  }
}
