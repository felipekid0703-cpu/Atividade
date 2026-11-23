import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { QuestionCard } from '@/components/QuestionCard'
import { useAuth } from '@/features/auth/useAuth'
import { supabase } from '@/lib/supabase'
import type { QuestionAnswerKeyRow, QuestionRow, StudentAnswerStatus } from '@/types/database'

export function QuestionPage() {
  const { id } = useParams()
  const { profile } = useAuth()
  const [question, setQuestion] = useState<QuestionRow | null>(null)
  const [subjectSlug, setSubjectSlug] = useState<string | null>(null)
  const [answer, setAnswer] = useState('')
  const [status, setStatus] = useState<StudentAnswerStatus>('draft')
  const [answerKey, setAnswerKey] = useState<QuestionAnswerKeyRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [answerKeyError, setAnswerKeyError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [ready, setReady] = useState(false)
  const savedAnswerRef = useRef('')
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve())
  const saveTimeoutRef = useRef<number | null>(null)

  const loadAnswerKey = useCallback(async (questionId: string) => {
    setAnswerKeyError(null)
    const { data, error } = await supabase
      .from('question_answer_keys')
      .select('*')
      .eq('question_id', questionId)
      .maybeSingle()
    if (error) {
      console.error('[student] Não foi possível carregar o gabarito.', error)
      setAnswerKey(null)
      setAnswerKeyError('Não foi possível carregar o gabarito. Tente novamente.')
    } else if (!data) {
      setAnswerKey(null)
      setAnswerKeyError('O gabarito ainda não foi cadastrado para esta questão.')
    } else {
      setAnswerKey(data)
    }
  }, [])

  const persistAnswer = useCallback(
    async (answerText: string, answerStatus: StudentAnswerStatus) => {
      if (!profile || !question) throw new Error('A questão ou a sessão não está disponível.')

      const operation = saveQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          const { error } = await supabase.from('student_answers').upsert(
            {
              student_id: profile.id,
              question_id: question.id,
              answer_text: answerText,
              status: answerStatus,
            },
            { onConflict: 'student_id,question_id' },
          )
          if (error) throw error
        })
      saveQueueRef.current = operation.catch(() => undefined)
      await operation
    },
    [profile, question],
  )

  useEffect(() => {
    let active = true

    async function loadQuestion() {
      if (!id || !profile) {
        setLoadError('Questão não encontrada.')
        setLoading(false)
        return
      }

      const { data: questionData, error: questionError } = await supabase
        .from('questions')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (!active) return
      if (questionError) {
        console.error('[student] Não foi possível carregar a questão.', questionError)
        setLoadError('Não foi possível carregar esta questão.')
        setLoading(false)
        return
      }
      if (!questionData) {
        setLoadError('Questão não encontrada.')
        setLoading(false)
        return
      }

      const { data: subjectData, error: subjectError } = await supabase
        .from('subjects')
        .select('slug')
        .eq('id', questionData.subject_id)
        .single()
      if (!active) return
      if (subjectError) {
        console.error('[student] Não foi possível carregar a matéria.', subjectError)
        setLoadError('Não foi possível carregar a matéria desta questão.')
        setLoading(false)
        return
      }

      const { data: answerData, error: answerError } = await supabase
        .from('student_answers')
        .select('*')
        .eq('student_id', profile.id)
        .eq('question_id', questionData.id)
        .maybeSingle()
      if (!active) return
      if (answerError) {
        console.error('[student] Não foi possível carregar o rascunho.', answerError)
        setLoadError('Não foi possível carregar sua resposta salva.')
        setLoading(false)
        return
      }

      setQuestion(questionData)
      setSubjectSlug(subjectData.slug)
      const existingAnswer = answerData?.answer_text ?? ''
      savedAnswerRef.current = existingAnswer
      setAnswer(existingAnswer)
      setStatus(answerData?.status ?? 'draft')
      setReady(true)
      setLoading(false)

      if (answerData?.status === 'submitted' || answerData?.status === 'reviewed') {
        await loadAnswerKey(questionData.id)
      }
    }

    void loadQuestion()
    return () => {
      active = false
      if (saveTimeoutRef.current !== null) {
        window.clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [id, loadAnswerKey, profile])

  useEffect(() => {
    if (
      !ready ||
      !question ||
      !profile ||
      status !== 'draft' ||
      answer === savedAnswerRef.current
    ) {
      return
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      setSaveState('saving')
      setSaveError(null)
      void persistAnswer(answer, 'draft')
        .then(() => {
          savedAnswerRef.current = answer
          setSaveState('saved')
        })
        .catch((error: unknown) => {
          console.error('[student] Não foi possível salvar o rascunho.', error)
          setSaveError('Não foi possível salvar. Verifique a conexão e tente novamente.')
          setSaveState('idle')
        })
    }, 2000)

    return () => {
      if (saveTimeoutRef.current !== null) {
        window.clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
    }
  }, [answer, persistAnswer, profile, question, ready, status])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!question || !answer.trim()) {
      setSubmitError('Escreva sua resposta antes de enviar.')
      return
    }

    if (saveTimeoutRef.current !== null) {
      window.clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      const finalAnswer = answer.trim()
      await persistAnswer(finalAnswer, 'submitted')
      savedAnswerRef.current = finalAnswer
      setAnswer(finalAnswer)
      setStatus('submitted')
      setSaveState('saved')
      await loadAnswerKey(question.id)
    } catch (error) {
      console.error('[student] Não foi possível enviar a resposta.', error)
      setSubmitError('Não foi possível enviar sua resposta. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      {subjectSlug && (
        <Link
          className="text-sm font-medium text-primary underline"
          to={`/student/subject/${subjectSlug}`}
        >
          Voltar às questões da matéria
        </Link>
      )}

      {loading ? (
        <p className="text-muted-foreground" aria-live="polite">
          Carregando questão...
        </p>
      ) : loadError ? (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm" role="alert">
          {loadError}
        </p>
      ) : question ? (
        <QuestionCard
          answer={answer}
          answerKey={answerKey}
          answerKeyError={answerKeyError}
          isSubmitting={isSubmitting}
          onAnswerChange={(value) => {
            setAnswer(value)
            setSaveState('idle')
            setSaveError(null)
          }}
          onSubmit={(event) => void handleSubmit(event)}
          question={question}
          saveError={saveError}
          saveState={saveState}
          status={status}
          submitError={submitError}
        />
      ) : null}
    </section>
  )
}
