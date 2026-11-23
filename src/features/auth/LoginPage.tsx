import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import { isSupabaseConfigured } from '@/lib/supabase'

export function LoginPage() {
  const { signIn, authenticated, profile, loading, authError } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!loading && authenticated && profile) return <Navigate to="/" replace />

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      await signIn(username, password)
    } catch (error) {
      console.error('[auth] Não foi possível iniciar o login.', error)
      setSubmitError(
        error instanceof Error && error.message === 'Informe um nome de usuário válido.'
          ? error.message
          : 'Usuário ou senha incorretos. Confira os dados e tente novamente.',
      )
      setIsSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <section className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Entrar no Caderno Inteligente</h1>
          <p className="text-sm text-muted-foreground">Entre com seu nome de usuário e senha.</p>
        </header>

        {!isSupabaseConfigured && (
          <p className="rounded-lg bg-warning/20 p-3 text-sm" role="status">
            Configure o Supabase em .env.local para habilitar o login.
          </p>
        )}
        {authError && (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm" role="alert">
            {authError}
          </p>
        )}
        {submitError && (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm" role="alert">
            {submitError}
          </p>
        )}

        <form className="space-y-4" onSubmit={(event) => void handleLogin(event)}>
          <label className="block space-y-1.5 text-sm font-medium">
            Nome de usuário
            <input
              autoComplete="username"
              className="w-full rounded-lg border bg-background px-3 py-2.5 font-normal"
              disabled={!isSupabaseConfigured || loading || isSubmitting}
              onChange={(event) => setUsername(event.target.value)}
              required
              value={username}
            />
          </label>
          <label className="block space-y-1.5 text-sm font-medium">
            Senha
            <input
              autoComplete="current-password"
              className="w-full rounded-lg border bg-background px-3 py-2.5 font-normal"
              disabled={!isSupabaseConfigured || loading || isSubmitting}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          <button
            className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!isSupabaseConfigured || loading || isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Conectando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          A criação de contas é feita pelo administrador.
        </p>
      </section>
    </main>
  )
}
