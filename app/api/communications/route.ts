import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/requireAuth'
import { assertBuildingAccess } from '@/lib/auth/assertBuildingAccess'
import { getCommunications, createCommunication, updateCommunication } from '@/lib/db/queries/communications'
import { getResidents } from '@/lib/db/queries/residents'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/communications' })

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes
    const { user } = authRes

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    if (!buildingId) {
      return NextResponse.json({ error: 'buildingId required' }, { status: 400 })
    }
    const access = assertBuildingAccess(user, buildingId)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const communications = await getCommunications(buildingId)
    return NextResponse.json({ communications })
  } catch (error) {
    log.error({ error }, 'Error fetching communications')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function resolveAuthorId(buildingId: string, userId: string, userName: string, userEmail?: string): Promise<string> {
  try {
    const residents = await getResidents(buildingId)
    if (residents.length === 0) {
      throw new Error('No residents found in building')
    }
    // Try to find resident by user_id (if column exists and is populated)
    if (userId) {
      const byUserId = residents.find(r => r.user_id === userId)
      if (byUserId) return byUserId.id
    }
    // Try to find resident by email
    if (userEmail) {
      const byEmail = residents.find(r => r.email?.toLowerCase() === userEmail.toLowerCase())
      if (byEmail) return byEmail.id
    }
    // Try to find resident by name (fallback)
    const byName = residents.find(r => r.name.toLowerCase() === userName.toLowerCase())
    if (byName) return byName.id
    // Fallback to first resident
    return residents[0].id
  } catch {
    // If anything fails, we'll let the DB constraint catch it
    throw new Error('Could not resolve author resident')
  }
}

export async function POST(request: Request) {
  try {
    const authRes = await requireAuth(request)
    if (authRes instanceof Response) return authRes
    const { user } = authRes

    const body = await request.json()
    
    const buildingId = body.building_id
    if (!buildingId) {
      return NextResponse.json({ error: 'building_id required' }, { status: 400 })
    }
    const access = assertBuildingAccess(user, buildingId)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const authorId = await resolveAuthorId(buildingId, body.author_id, body.author_name, body.author_email)

    const commData = {
      building_id: buildingId,
      author_id: authorId,
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
