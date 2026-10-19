import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { assertBuildingAccess } from '@/lib/auth/assertBuildingAccess'
import { getShiftReports, createShiftReport } from '@/lib/db/queries/shift-reports'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/shift-reports' })

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, ['vigilante', 'admin', 'super_admin'])
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    if (!buildingId) {
      return NextResponse.json({ error: 'buildingId required' }, { status: 400 })
    }
    const access = assertBuildingAccess(user, buildingId)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const reports = await getShiftReports(buildingId)
    return NextResponse.json({ reports })
  } catch (error) {
    log.error({ error }, 'Error fetching shift reports')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, ['vigilante', 'admin', 'super_admin'])
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const body = await request.json()

    const { building_id, guard_name, shift_start, shift_end, incidents, notes } = body
    if (!building_id) {
      return NextResponse.json({ error: 'building_id required' }, { status: 400 })
    }
    if (!guard_name) {
      return NextResponse.json({ error: 'guard_name required' }, { status: 400 })
    }
    if (!shift_start) {
      return NextResponse.json({ error: 'shift_start required' }, { status: 400 })
    }
    if (!shift_end) {
      return NextResponse.json({ error: 'shift_end required' }, { status: 400 })
    }
    if (incidents === undefined || incidents === null) {
      return NextResponse.json({ error: 'incidents required' }, { status: 400 })
    }
    if (!notes) {
      return NextResponse.json({ error: 'notes required' }, { status: 400 })
    }

    const access = assertBuildingAccess(user, building_id)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    await createShiftReport({
      building_id,
      guard_name,
      shift_start,
      shift_end: shift_end || null,
      incidents: String(incidents),
      notes: notes || null,
      audio_transcription: null,
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    log.error({ error }, 'Error creating shift report')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
