import 'server-only'
import { queryMany, queryOne, executeInsert } from './helpers'
import type { InValue } from './helpers'

export interface DbSurvey {
  id: string
  building_id: string
  title: string
  description: string | null
  created_by: string
  status: string
  start_date: string
  end_date: string | null
  created_at: string
}

export interface DbSurveyQuestion {
  id: string
  survey_id: string
  question_text: string
  question_type: string
  options: string[] | null
  is_required: boolean
  order_index: number
  created_at: string
}

export interface DbSurveyResponse {
  id: string
  survey_id: string
  question_id: string
  respondent_id: string
  respondent_name: string | null
  respondent_unit: string | null
  rating_value: number | null
  text_value: string | null
  selected_option: string | null
  created_at: string
}

// ── List surveys with optional status filter ──

export async function getSurveys(
  buildingId: string,
  status?: string
): Promise<DbSurvey[]> {
  const conditions: InValue[] = [buildingId]
  const wheres: string[] = ['building_id = ?']

  if (status) {
    wheres.push('status = ?')
    conditions.push(status)
  }

  const sql = `SELECT * FROM surveys WHERE ${wheres.join(' AND ')} ORDER BY created_at DESC`
  return queryMany<DbSurvey>(sql, conditions)
}

// ── Get survey by ID ──

export async function getSurveyById(id: string): Promise<DbSurvey | null> {
  return queryOne<DbSurvey>(
    'SELECT * FROM surveys WHERE id = ?',
    [id]
  )
}

// ── Get questions for a survey ──

export async function getSurveyQuestions(surveyId: string): Promise<DbSurveyQuestion[]> {
  return queryMany<DbSurveyQuestion>(
    'SELECT * FROM survey_questions WHERE survey_id = ? ORDER BY order_index ASC',
    [surveyId]
  )
}

// ── Create survey ──

export async function createSurvey(data: {
  building_id: string
  title: string
  description?: string | null
  created_by: string
  status?: string
  start_date?: string
  end_date?: string | null
}): Promise<DbSurvey> {
  const id = crypto.randomUUID()
  await executeInsert(
    `INSERT INTO surveys (id, building_id, title, description, created_by, status, start_date, end_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.building_id,
      data.title,
      data.description || null,
      data.created_by,
      data.status || 'active',
      data.start_date || new Date().toISOString(),
      data.end_date || null,
    ]
  )
  const created = await getSurveyById(id)
  return created!
}

// ── Add question to survey ──

export async function addQuestion(surveyId: string, data: {
  question_text: string
  question_type: string
  options?: string[] | null
  is_required?: boolean
  order_index: number
}): Promise<DbSurveyQuestion> {
  const id = crypto.randomUUID()
  await executeInsert(
    `INSERT INTO survey_questions (id, survey_id, question_text, question_type, options, is_required, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      surveyId,
      data.question_text,
      data.question_type,
      data.options ? JSON.stringify(data.options) : null,
      data.is_required !== false,
      data.order_index,
    ]
  )
  return {
    id,
    survey_id: surveyId,
    question_text: data.question_text,
    question_type: data.question_type,
    options: data.options || null,
    is_required: data.is_required !== false,
    order_index: data.order_index,
    created_at: new Date().toISOString(),
  }
}

// ── Submit response ──

export async function submitResponse(
  surveyId: string,
  respondentId: string,
  respondentName: string,
  respondentUnit: string | null,
  answers: Array<{
    question_id: string
    rating_value?: number | null
    text_value?: string | null
    selected_option?: string | null
  }>
): Promise<void> {
  for (const answer of answers) {
    const id = crypto.randomUUID()
    await executeInsert(
      `INSERT INTO survey_responses (id, survey_id, question_id, respondent_id, respondent_name, respondent_unit, rating_value, text_value, selected_option)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        surveyId,
        answer.question_id,
        respondentId,
        respondentName,
        respondentUnit || null,
        answer.rating_value ?? null,
        answer.text_value || null,
        answer.selected_option || null,
      ]
    )
  }
}

// ── Get survey results (aggregated) ──

export interface SurveyResults {
  survey: DbSurvey
  total_respondents: number
  questions: Array<{
    question: DbSurveyQuestion
    avg_rating?: number | null
    distribution?: Record<string, number>
    text_responses?: string[]
  }>
}

export async function getSurveyResults(surveyId: string): Promise<SurveyResults | null> {
  const survey = await getSurveyById(surveyId)
  if (!survey) return null

  const questions = await getSurveyQuestions(surveyId)
  const responses = await queryMany<DbSurveyResponse>(
    'SELECT * FROM survey_responses WHERE survey_id = ?',
    [surveyId]
  )

  // Count unique respondents
  const uniqueRespondents = new Set(responses.map(r => r.respondent_id))

  const questionResults = questions.map(q => {
    const qResponses = responses.filter(r => r.question_id === q.id)

    if (q.question_type === 'rating') {
      const ratings = qResponses.map(r => r.rating_value).filter((v): v is number => v !== null)
      const avg = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null
      return {
        question: q,
        avg_rating: avg ? Math.round(avg * 10) / 10 : null,
        distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, ...Object.fromEntries(
          Array.from({ length: 5 }, (_, i) => [String(i + 1), ratings.filter(r => r === i + 1).length])
        ) },
      }
    }

    if (q.question_type === 'multiple_choice' || q.question_type === 'yes_no') {
      const options = q.options || []
      const dist: Record<string, number> = {}
      for (const opt of options) {
        dist[opt] = qResponses.filter(r => r.selected_option === opt).length
      }
      return { question: q, distribution: dist }
    }

    // text
    return {
      question: q,
      text_responses: qResponses.map(r => r.text_value).filter((v): v is string => v !== null),
    }
  })

  return {
    survey,
    total_respondents: uniqueRespondents.size,
    questions: questionResults,
  }
}

// ── Check if user already responded ──

export async function hasUserResponded(surveyId: string, userId: string): Promise<boolean> {
  const result = await queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM survey_responses WHERE survey_id = ? AND respondent_id = ?',
    [surveyId, userId]
  )
  return (result?.count ?? 0) > 0
}
