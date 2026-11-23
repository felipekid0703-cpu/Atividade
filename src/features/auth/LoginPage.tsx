import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import { isKeycloakConfigured } from '@/lib/keycloak'
import { isSupabaseConfigured } from '@/lib/supabase'

export function LoginPage() {
  const { signIn, authenticated, profile, loading, authError } = useAuth()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isConfigured = isKeycloakConfigured && isSupabaseConfigured

  if (!loading && authenticated && profile) return <Navigate to="/" replace />

  async function handleLogin() {
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      await signIn()
    } catch (error) {
      console.error('[auth] Não foi possível iniciar o login.', error)
      setSubmitError('Não foi possível iniciar o login. Tente novamente.')
      setIsSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <section className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Entrar no Caderno Inteligente</h1>
          <p className="text-sm text-muted-foreground">
            Entre com seu nome de usuário e senha.
          </p>
        </header>

        {!isConfigured && (
          <p className="rounded-lg bg-warning/20 p-3 text-sm" role="status">
            Configure o Keycloak e o Supabase em .env.local para habilitar o login.
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

        <button
          className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!isConfigured || loading || isSubmitting}
          onClick={() => void handleLogin()}
          type="button"
        >
          {isSubmitting ? 'Conectando...' : 'Entrar'}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          Ainda não tem conta?{' '}
          <Link className="font-medium text-primary underline-offset-4 hover:underline" to="/signup">
            Criar conta
          </Link>
        </p>
      </section>
    </main>
  )
}
