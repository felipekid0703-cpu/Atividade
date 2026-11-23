import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { QuestionRow, SubjectRow } from '@/types/database'

export function SubjectPage() {
  const { slug } = useParams()
  const [subject, setSubject] = useState<SubjectRow | null>(null)
  const [questions, setQuestions] = useState<QuestionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadSubject() {
      if (!slug) {
        setLoadError('Matéria não encontrada.')
        setLoading(false)
        return
      }

      const { data: subjectData, error: subjectError } = await supabase
        .from('subjects')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()
      if (!active) return
      if (subjectError) {
        console.error('[student] Não foi possível carregar a matéria.', subjectError)
        setLoadError('Não foi possível carregar esta matéria.')
        setLoading(false)
        return
      }
      if (!subjectData) {
        setLoadError('Matéria não encontrada.')
        setLoading(false)
        return
      }

      setSubject(subjectData)
      const { data: questionData, error: questionError } = await supabase
        .from('questions')
        .select('*')
        .eq('subject_id', subjectData.id)
        .order('number')
      if (!active) return
      if (questionError) {
        console.error('[student] Não foi possível carregar as questões.', questionError)
        setLoadError('Não foi possível carregar as questões desta matéria.')
      } else {
        setQuestions(questionData)
      }
      setLoading(false)
    }

    void loadSubject()
    return () => {
      active = false
    }
  }, [slug])

  return (
    <section className="space-y-6">
      <Link className="text-sm font-medium text-primary underline" to="/student/dashboard">
        Voltar às matérias
      </Link>

      {loading ? (
        <p className="text-muted-foreground" aria-live="polite">
          Carregando questões...
        </p>
      ) : loadError ? (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm" role="alert">
          {loadError}
        </p>
      ) : (
        <>
          <header>
            <p className="text-sm font-medium text-primary">Matéria</p>
            <h1 className="mt-1 text-2xl font-semibold">{subject?.name}</h1>
            <p className="mt-2 text-muted-foreground">
              Escolha uma questão. Seu rascunho será salvo automaticamente.
            </p>
          </header>

          <ol className="space-y-3">
            {questions.map((question) => (
              <li key={question.id}>
                <Link
                  className="block rounded-xl border bg-card p-4 text-card-foreground transition hover:border-primary"
                  to={`/student/question/${question.id}`}
                >
                  <span className="font-medium">Questão {question.number}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{question.block}</span>
                </Link>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  )
}
