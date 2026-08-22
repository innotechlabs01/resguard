import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { getCommunications, createCommunication, updateCommunication } from '@/lib/db/queries/communications'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/communications' })

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    if (!buildingId) {
      return NextResponse.json({ error: 'buildingId required' }, { status: 400 })
    }

    const communications = await getCommunications(buildingId)
    return NextResponse.json({ communications })
  } catch (error) {
    log.error({ error }, 'Error fetching communications')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes

    const body = await request.json()
    
    const commData = {
      building_id: body.building_id,
      author_id: body.author_id,
      author_name: body.author_name,
      title: body.title,
      message: body.message,
      type: body.type || 'announcement',
      priority: body.priority || 'normal',
      target_roles: body.target_roles || ['usuario'],
      includes_tenants: body.includes_tenants || false,
      sent_at: body.sent_at || new Date().toISOString(),
      read_by: body.read_by || [],
    }

    await createCommunication(commData)
    return NextResponse.json({ success: true, message: 'Communication created successfully' }, { status: 201 })
  } catch (error) {
    log.error({ error }, 'Error creating communication')
    return NextResponse.json({ error: 'Failed to create communication', details: String(error) }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Communication ID required' }, { status: 400 })
    }

    await updateCommunication(id, updates)
    return NextResponse.json({ success: true, message: 'Communication updated successfully' })
  } catch (error) {
    log.error({ error }, 'Error updating communication')
    return NextResponse.json({ error: 'Failed to update communication' }, { status: 500 })
  }
}
