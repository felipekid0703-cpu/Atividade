import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import { supabase } from '@/lib/supabase'
import type { SubjectRow } from '@/types/database'

export function StudentDashboardPage() {
  const { profile } = useAuth()
  const [subjects, setSubjects] = useState<SubjectRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadSubjects() {
      const { data, error } = await supabase.from('subjects').select('*')
      if (!active) return
      if (error) {
        console.error('[student] Não foi possível carregar as matérias.', error)
        setLoadError('Não foi possível carregar as matérias. Tente novamente.')
      } else {
        const order = ['ingles', 'portugues', 'matematica-dia-1', 'matematica-dia-2', 'filosofia']
        setSubjects(
          [...data].sort((left, right) => order.indexOf(left.slug) - order.indexOf(right.slug)),
        )
      }
      setLoading(false)
    }

    void loadSubjects()
    return () => {
      active = false
    }
  }, [])

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm font-medium text-primary">Área do aluno</p>
        <h1 className="mt-1 text-2xl font-semibold">
          Olá{profile?.full_name ? `, ${profile.full_name}` : ''}!
        </h1>
        <p className="mt-2 text-muted-foreground">
          Escolha uma matéria para começar. Priorize Inglês e Português para as próximas avaliações.
        </p>
      </header>

      {loadError && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm" role="alert">
          {loadError}
        </p>
      )}
      {loading ? (
        <p className="text-muted-foreground" aria-live="polite">
          Carregando matérias...
        </p>
      ) : subjects.length === 0 ? (
        <p className="rounded-2xl border bg-card p-5 text-card-foreground">
          Ainda não há matérias carregadas. Avise o tutor responsável.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {subjects.map((subject) => (
            <Link
              key={subject.id}
              className="flex items-center justify-between gap-4 rounded-2xl border bg-card p-5 text-card-foreground transition hover:border-primary"
              to={`/student/subject/${subject.slug}`}
            >
              <div>
                <h2 className="font-semibold">{subject.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {subject.question_count} questões
                </p>
              </div>
              <ArrowRight aria-hidden className="shrink-0 text-primary" size={20} />
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
