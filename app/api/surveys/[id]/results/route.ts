import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { getSurveyResults } from '@/lib/db/queries/surveys'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/surveys/[id]/results' })

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request, ['admin', 'super_admin'])
    if (isAuthResponse(authResult)) return authResult

    const { id } = await params
    const results = await getSurveyResults(id)
    if (!results) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    return NextResponse.json({ results })
  } catch (error) {
    log.error({ error }, 'Error fetching survey results')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
