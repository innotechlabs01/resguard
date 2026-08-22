import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { getOnboardingById, updateOnboardingItem } from '@/lib/db/queries/onboarding'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/onboarding/[id]' })

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (isAuthResponse(authResult)) return authResult

    const { id } = await params
    const checklist = await getOnboardingById(id)
    if (!checklist) {
      return NextResponse.json({ error: 'Checklist not found' }, { status: 404 })
    }

    return NextResponse.json({ checklist })
  } catch (error) {
    log.error({ error }, 'Error fetching onboarding checklist')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (isAuthResponse(authResult)) return authResult

    const { id } = await params
    const checklist = await getOnboardingById(id)
    if (!checklist) {
      return NextResponse.json({ error: 'Checklist not found' }, { status: 404 })
    }

    const body = await request.json()
    const { item, value } = body

    if (!item || typeof value !== 'boolean') {
      return NextResponse.json({ error: 'item (string) and value (boolean) required' }, { status: 400 })
    }

    await updateOnboardingItem(id, item, value)

    const updated = await getOnboardingById(id)
    return NextResponse.json({ checklist: updated })
  } catch (error) {
    log.error({ error }, 'Error updating onboarding checklist')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
