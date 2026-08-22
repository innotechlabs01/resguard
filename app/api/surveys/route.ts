import { NextResponse } from 'next/server'
import { requireAuth, isAuthResponse } from '@/lib/auth/requireAuth'
import { getSurveys, createSurvey, addQuestion } from '@/lib/db/queries/surveys'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'api/surveys' })

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request)
    if (isAuthResponse(authResult)) return authResult

    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('buildingId')
    if (!buildingId) {
      return NextResponse.json({ error: 'buildingId required' }, { status: 400 })
    }

    const status = searchParams.get('status') || undefined
    const surveys = await getSurveys(buildingId, status)
    return NextResponse.json({ surveys })
  } catch (error) {
    log.error({ error }, 'Error fetching surveys')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, ['admin', 'super_admin'])
    if (isAuthResponse(authResult)) return authResult
    const { user } = authResult

    const body = await request.json()
    const { title, description, building_id, status, start_date, end_date, questions } = body

    if (!title || !building_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const survey = await createSurvey({
      building_id,
      title,
      description: description || null,
      created_by: user.name || user.email,
      status: status || 'active',
      start_date: start_date || undefined,
      end_date: end_date || null,
    })

    // Add questions if provided
    if (questions && Array.isArray(questions)) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        await addQuestion(survey.id, {
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options || null,
          is_required: q.is_required !== false,
          order_index: i,
        })
      }
    }

    return NextResponse.json({ survey }, { status: 201 })
  } catch (error) {
    log.error({ error }, 'Error creating survey')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
