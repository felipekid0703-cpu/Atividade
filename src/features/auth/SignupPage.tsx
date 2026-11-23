import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import { isKeycloakConfigured } from '@/lib/keycloak'
import { isSupabaseConfigured } from '@/lib/supabase'

export function SignupPage() {
  const { signUp, authenticated, profile, loading } = useAuth()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isConfigured = isKeycloakConfigured && isSupabaseConfigured

  if (!loading && authenticated && profile) return <Navigate to="/" replace />

  async function handleSignup() {
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      await signUp()
    } catch (error) {
      console.error('[auth] Não foi possível iniciar o cadastro.', error)
      setSubmitError('Não foi possível iniciar o cadastro. Tente novamente.')
      setIsSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <section className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Criar sua conta</h1>
          <p className="text-sm text-muted-foreground">
            Novas contas recebem o perfil de aluno. O perfil de tutor é atribuído pelo
            administrador.
          </p>
        </header>

        {!isConfigured && (
          <p className="rounded-lg bg-warning/20 p-3 text-sm" role="status">
            Configure o Keycloak e o Supabase em .env.local para habilitar o cadastro.
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
          onClick={() => void handleSignup()}
          type="button"
        >
          {isSubmitting ? 'Conectando...' : 'Continuar para o cadastro'}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{' '}
          <Link className="font-medium text-primary underline-offset-4 hover:underline" to="/login">
            Entrar
          </Link>
        </p>
      </section>
    </main>
  )
}
