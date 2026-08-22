import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { getOnboardingByBuilding, createOnboarding } from '@/lib/db/queries/onboarding'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/onboarding' })

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request)
    if (isAuthResponse(authResult)) return authResult

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    if (!buildingId) {
      return NextResponse.json({ error: 'buildingId required' }, { status: 400 })
    }

    const checklists = await getOnboardingByBuilding(buildingId)
    return NextResponse.json({ checklists })
  } catch (error) {
    log.error({ error }, 'Error fetching onboarding checklists')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, ['admin', 'super_admin'])
    if (isAuthResponse(authResult)) return authResult

    const body = await request.json()
    const { building_id, user_id, user_name, user_unit } = body

    if (!building_id || !user_id || !user_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const checklist = await createOnboarding({
      building_id,
      user_id,
      user_name,
      user_unit: user_unit || null,
    })

    return NextResponse.json({ checklist }, { status: 201 })
  } catch (error) {
    log.error({ error }, 'Error creating onboarding checklist')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
