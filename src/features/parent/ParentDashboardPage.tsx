import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'

export function ParentDashboardPage() {
  const { profile } = useAuth()

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm font-medium text-primary">Área do tutor</p>
        <h1 className="mt-1 text-2xl font-semibold">
          Olá{profile?.full_name ? `, ${profile.full_name}` : ''}!
        </h1>
        <p className="mt-2 text-muted-foreground">
          O acompanhamento do aluno vinculado ficará disponível na próxima etapa.
        </p>
      </header>
      <div className="rounded-2xl border bg-card p-5 text-card-foreground">
        <h2 className="font-semibold">Acompanhamento</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          As respostas e o progresso do aluno serão adicionados na próxima etapa.
        </p>
        <Link
          className="mt-4 inline-block text-sm font-medium text-primary underline"
          to="/settings"
        >
          Acessar configurações
        </Link>
      </div>
    </section>
  )
}
