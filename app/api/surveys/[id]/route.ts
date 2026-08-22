import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { getSurveyById, getSurveyQuestions, submitResponse, getSurveyResults, hasUserResponded } from '@/lib/db/queries/surveys'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/surveys/[id]' })

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (isAuthResponse(authResult)) return authResult

    const { id } = await params
    const survey = await getSurveyById(id)
    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    const questions = await getSurveyQuestions(id)
    const alreadyResponded = await hasUserResponded(id, authResult.user.id)

    return NextResponse.json({ survey, questions, alreadyResponded })
  } catch (error) {
    log.error({ error }, 'Error fetching survey detail')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const { id } = await params
    const survey = await getSurveyById(id)
    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    if (survey.status !== 'active') {
      return NextResponse.json({ error: 'Survey is not active' }, { status: 400 })
    }

    // Check if already responded
    const already = await hasUserResponded(id, user.id)
    if (already) {
      return NextResponse.json({ error: 'Already responded' }, { status: 409 })
    }

    const body = await request.json()
    const { answers } = body

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ error: 'Answers required' }, { status: 400 })
    }

    await submitResponse(
      id,
      user.id,
      user.name || user.email,
      null,
      answers
    )

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    log.error({ error }, 'Error submitting survey response')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
