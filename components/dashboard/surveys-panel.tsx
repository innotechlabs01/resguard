'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/lib/auth-context'
import {
  ClipboardCheck,
  Plus,
  Star,
  MessageSquare,
  CheckCircle2,
  Clock,
  BarChart3,
  Trash2,
  ArrowLeft,
  Loader2,
} from 'lucide-react'

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-800' },
  active: { label: 'Activa', color: 'bg-green-100 text-green-800' },
  closed: { label: 'Cerrada', color: 'bg-red-100 text-red-800' },
}

const questionTypeLabels: Record<string, string> = {
  rating: 'Calificacion (1-5)',
  text: 'Texto libre',
  yes_no: 'Si / No',
  multiple_choice: 'Opcion multiple',
}

// ── Interfaces ──

interface SurveyItem {
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

interface SurveyQuestion {
  id: string
  survey_id: string
  question_text: string
  question_type: string
  options: string[] | null
  is_required: boolean
  order_index: number
  created_at: string
}

interface SurveyResult {
  survey: SurveyItem
  total_respondents: number
  questions: Array<{
    question: SurveyQuestion
    avg_rating?: number | null
    distribution?: Record<string, number>
    text_responses?: string[]
  }>
}

// ── Main Panel ──

export function SurveysPanel({ buildingId }: { buildingId: string }) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  const [surveysList, setSurveysList] = useState<SurveyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('active')
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyItem | null>(null)
  const [surveyDetail, setSurveyDetail] = useState<{ survey: SurveyItem; questions: SurveyQuestion[]; alreadyResponded: boolean } | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [resultsData, setResultsData] = useState<SurveyResult | null>(null)

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    end_date: '',
  })
  const [questionsForm, setQuestionsForm] = useState<Array<{
    question_text: string
    question_type: string
    options: string
    is_required: boolean
  }>>([{ question_text: '', question_type: 'rating', options: '', is_required: true }])
  const [creating, setCreating] = useState(false)

  // Response form
  const [answers, setAnswers] = useState<Record<string, { rating_value?: number; text_value?: string; selected_option?: string }>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Fetch surveys
  const fetchSurveys = useCallback(async () => {
    try {
      const params = new URLSearchParams({ buildingId })
      if (activeTab !== 'all') params.set('status', activeTab)
      const res = await fetch(`/api/surveys?${params}`)
      if (res.ok) {
        const data = await res.json()
        setSurveysList(data.surveys || [])
      }
    } catch (err) {
      console.error('Error fetching surveys:', err)
    } finally {
      setLoading(false)
    }
  }, [buildingId, activeTab])

  useEffect(() => { fetchSurveys() }, [fetchSurveys])

  // Open survey detail
  const openDetail = async (survey: SurveyItem) => {
    setSelectedSurvey(survey)
    setLoadingDetail(true)
    setShowResults(false)
    setResultsData(null)
    setSubmitted(false)
    setAnswers({})
    try {
      const res = await fetch(`/api/surveys/${survey.id}`)
      if (res.ok) {
        const data = await res.json()
        setSurveyDetail(data)
      }
    } catch (err) {
      console.error('Error fetching survey detail:', err)
    } finally {
      setLoadingDetail(false)
    }
  }

  // Load results (admin)
  const loadResults = async (surveyId: string) => {
    try {
      const res = await fetch(`/api/surveys/${surveyId}/results`)
      if (res.ok) {
        const data = await res.json()
        setResultsData(data.results)
        setShowResults(true)
      }
    } catch (err) {
      console.error('Error loading results:', err)
    }
  }

  // Submit response
  const handleSubmitResponse = async () => {
    if (!surveyDetail) return
    setSubmitting(true)
    try {
      const answerArray = surveyDetail.questions.map(q => ({
        question_id: q.id,
        ...answers[q.id],
      }))
      const res = await fetch(`/api/surveys/${surveyDetail.survey.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answerArray }),
      })
      if (res.ok) {
        setSubmitted(true)
        fetchSurveys()
      }
    } catch (err) {
      console.error('Error submitting response:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // Create survey
  const handleCreateSurvey = async () => {
    if (!createForm.title) return
    setCreating(true)
    try {
      const validQuestions = questionsForm.filter(q => q.question_text.trim())
      const res = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: createForm.title,
          description: createForm.description || null,
          building_id: buildingId,
          end_date: createForm.end_date || null,
          questions: validQuestions.map(q => ({
            question_text: q.question_text,
            question_type: q.question_type,
            options: q.question_type === 'multiple_choice'
              ? q.options.split(',').map(o => o.trim()).filter(Boolean)
              : q.question_type === 'yes_no' ? ['Si', 'No']
              : null,
            is_required: q.is_required,
          })),
        }),
      })
      if (res.ok) {
        setCreateDialogOpen(false)
        setCreateForm({ title: '', description: '', end_date: '' })
        setQuestionsForm([{ question_text: '', question_type: 'rating', options: '', is_required: true }])
        fetchSurveys()
      }
    } catch (err) {
      console.error('Error creating survey:', err)
    } finally {
      setCreating(false)
    }
  }

  // Progress calculation for resident form
  const getProgress = () => {
    if (!surveyDetail) return 0
    const answered = surveyDetail.questions.filter(q => {
      const a = answers[q.id]
      if (!a) return false
      if (q.question_type === 'rating') return a.rating_value !== undefined
      if (q.question_type === 'text') return !!a.text_value?.trim()
      if (q.question_type === 'yes_no' || q.question_type === 'multiple_choice') return !!a.selected_option
      return false
    }).length
    return Math.round((answered / surveyDetail.questions.length) * 100)
  }

  // ── Results View ──

  if (showResults && resultsData) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => { setShowResults(false); setResultsData(null) }} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> Resultados: {resultsData.survey.title}
            </CardTitle>
            <CardDescription>{resultsData.total_respondents} residentes respondieron</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {resultsData.questions.map((qr, idx) => (
              <div key={idx} className="border-b border-border pb-4 last:border-0">
                <p className="font-medium text-foreground mb-2">{qr.question.question_text}</p>

                {qr.avg_rating !== undefined && qr.avg_rating !== null && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < Math.round(qr.avg_rating!) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-foreground">{qr.avg_rating}/5</span>
                  </div>
                )}

                {qr.distribution && (
                  <div className="space-y-1">
                    {Object.entries(qr.distribution).map(([opt, count]) => (
                      <div key={opt} className="flex items-center gap-2 text-sm">
                        <span className="w-20 text-muted-foreground">{opt}</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${resultsData.total_respondents > 0 ? (count / resultsData.total_respondents) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-muted-foreground">{count}</span>
                      </div>
                    ))}
                  </div>
                )}

                {qr.text_responses && qr.text_responses.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {qr.text_responses.map((text, ti) => (
                      <div key={ti} className="p-2 bg-muted/50 rounded text-sm text-foreground">
                        "{text}"
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Detail View (Resident Response or Admin Detail) ──

  if (selectedSurvey && surveyDetail) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => { setSelectedSurvey(null); setSurveyDetail(null); fetchSurveys(); }} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{surveyDetail.survey.title}</CardTitle>
                <CardDescription className="mt-1">
                  {surveyDetail.survey.description && <span>{surveyDetail.survey.description} · </span>}
                  Creada por {surveyDetail.survey.created_by}
                </CardDescription>
              </div>
              <Badge className={statusConfig[surveyDetail.survey.status]?.color || ''}>
                {statusConfig[surveyDetail.survey.status]?.label}
              </Badge>
            </div>
          </CardHeader>
          {isAdmin && (
            <CardContent>
              <Button variant="outline" onClick={() => loadResults(surveyDetail.survey.id)} className="gap-2">
                <BarChart3 className="h-4 w-4" /> Ver Resultados
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Resident response form */}
        {!isAdmin && surveyDetail.alreadyResponded ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <p className="text-lg font-semibold text-foreground">Ya completaste esta encuesta</p>
              <p className="text-sm text-muted-foreground mt-1">Gracias por tu participacion</p>
            </CardContent>
          </Card>
        ) : !isAdmin && submitted ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <p className="text-lg font-semibold text-foreground">Gracias por tu respuesta</p>
              <p className="text-sm text-muted-foreground mt-1">Tu opinion nos ayuda a mejorar</p>
            </CardContent>
          </Card>
        ) : !isAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Responda la encuesta</CardTitle>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${getProgress()}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{getProgress()}% completado</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                surveyDetail.questions.map((q) => (
                  <div key={q.id} className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {q.question_text}
                      {q.is_required && <span className="text-red-500 ml-1">*</span>}
                    </label>

                    {q.question_type === 'rating' && (
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(v => (
                          <button
                            key={v}
                            onClick={() => setAnswers(prev => ({ ...prev, [q.id]: { rating_value: v } }))}
                            className="p-1"
                          >
                            <Star className={`h-6 w-6 ${answers[q.id]?.rating_value === v ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`} />
                          </button>
                        ))}
                      </div>
                    )}

                    {q.question_type === 'text' && (
                      <Textarea
                        value={answers[q.id]?.text_value || ''}
                        onChange={e => setAnswers(prev => ({ ...prev, [q.id]: { text_value: e.target.value } }))}
                        placeholder="Escriba su respuesta..."
                        rows={3}
                      />
                    )}

                    {q.question_type === 'yes_no' && (
                      <div className="flex gap-2">
                        {['Si', 'No'].map(opt => (
                          <Button
                            key={opt}
                            variant={answers[q.id]?.selected_option === opt ? 'default' : 'outline'}
                            onClick={() => setAnswers(prev => ({ ...prev, [q.id]: { selected_option: opt } }))}
                          >
                            {opt}
                          </Button>
                        ))}
                      </div>
                    )}

                    {q.question_type === 'multiple_choice' && q.options && (
                      <div className="space-y-2">
                        {q.options.map(opt => (
                          <label key={opt} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={q.id}
                              checked={answers[q.id]?.selected_option === opt}
                              onChange={() => setAnswers(prev => ({ ...prev, [q.id]: { selected_option: opt } }))}
                              className="accent-primary"
                            />
                            <span className="text-sm text-foreground">{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}

              <Button onClick={handleSubmitResponse} disabled={submitting || getProgress() < 100} className="w-full">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Enviar Respuestas
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    )
  }

  // ── Tabs ──

  const tabs = isAdmin
    ? [
        { id: 'active', label: 'Activas' },
        { id: 'draft', label: 'Borradores' },
        { id: 'closed', label: 'Cerradas' },
        { id: 'all', label: 'Todas' },
      ]
    : [
        { id: 'active', label: 'Disponibles' },
        { id: 'all', label: 'Todas' },
      ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Encuestas</h2>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Crear Encuesta
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Surveys list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : surveysList.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay encuestas en esta categoria</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {surveysList.map(survey => (
            <Card
              key={survey.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => openDetail(survey)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{survey.title}</h3>
                      <Badge className={statusConfig[survey.status]?.color || ''}>
                        {statusConfig[survey.status]?.label}
                      </Badge>
                    </div>
                    {survey.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{survey.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(survey.created_at).toLocaleDateString('es-CO')}
                      </span>
                      <span>Creada por {survey.created_by}</span>
                      {survey.end_date && (
                        <span>Hasta {new Date(survey.end_date).toLocaleDateString('es-CO')}</span>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); loadResults(survey.id) }}
                      className="gap-1"
                    >
                      <BarChart3 className="h-4 w-4" /> Resultados
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Encuesta</DialogTitle>
            <DialogDescription>Configure la encuesta y sus preguntas</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Titulo *</label>
              <Input
                value={createForm.title}
                onChange={e => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ej: Encuesta de satisfaccion Q3"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Descripcion</label>
              <Textarea
                value={createForm.description}
                onChange={e => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripcion breve de la encuesta..."
                rows={2}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Fecha de cierre</label>
              <Input
                type="date"
                value={createForm.end_date}
                onChange={e => setCreateForm(prev => ({ ...prev, end_date: e.target.value }))}
                className="mt-1"
              />
            </div>

            {/* Questions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">Preguntas</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuestionsForm(prev => [...prev, { question_text: '', question_type: 'rating', options: '', is_required: true }])}
                >
                  <Plus className="h-3 w-3 mr-1" /> Agregar
                </Button>
              </div>
              <div className="space-y-3">
                {questionsForm.map((q, idx) => (
                  <div key={idx} className="p-3 border border-border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Pregunta {idx + 1}</span>
                      {questionsForm.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setQuestionsForm(prev => prev.filter((_, i) => i !== idx))}
                          className="h-6 px-2 text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <Input
                      value={q.question_text}
                      onChange={e => {
                        const updated = [...questionsForm]
                        updated[idx].question_text = e.target.value
                        setQuestionsForm(updated)
                      }}
                      placeholder="Texto de la pregunta..."
                    />
                    <div className="flex gap-2">
                      <Select
                        value={q.question_type}
                        onValueChange={v => {
                          const updated = [...questionsForm]
                          updated[idx].question_type = v
                          setQuestionsForm(updated)
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(questionTypeLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {q.question_type === 'multiple_choice' && (
                      <Input
                        value={q.options}
                        onChange={e => {
                          const updated = [...questionsForm]
                          updated[idx].options = e.target.value
                          setQuestionsForm(updated)
                        }}
                        placeholder="Opciones separadas por coma..."
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateSurvey} disabled={creating || !createForm.title}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
