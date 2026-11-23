import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'

export function StudentDashboardPage() {
  const { profile } = useAuth()

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm font-medium text-primary">Área do aluno</p>
        <h1 className="mt-1 text-2xl font-semibold">
          Olá{profile?.full_name ? `, ${profile.full_name}` : ''}!
        </h1>
        <p className="mt-2 text-muted-foreground">
          Seu painel de estudos ficará disponível nas próximas etapas.
        </p>
      </header>
      <div className="rounded-2xl border bg-card p-5 text-card-foreground">
        <h2 className="font-semibold">Próximos passos</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          As questões, o cronograma e o acompanhamento do seu progresso serão adicionados
          em breve.
        </p>
        <Link className="mt-4 inline-block text-sm font-medium text-primary underline" to="/settings">
          Acessar configurações
        </Link>
      </div>
    </section>
  )
}
