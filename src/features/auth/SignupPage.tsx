import { Link } from 'react-router-dom'

export function SignupPage() {
  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <section className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Cadastro desativado</h1>
          <p className="text-sm text-muted-foreground">
            As contas são criadas pelo administrador para proteger os perfis de aluno e responsável.
          </p>
        </header>

        <p className="text-center text-sm text-muted-foreground">
          <Link className="font-medium text-primary underline-offset-4 hover:underline" to="/login">
            Voltar ao login
          </Link>
        </p>
      </section>
    </main>
  )
}
