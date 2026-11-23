import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '@/features/auth/useAuth'
import { isSupabaseConfigured } from '@/lib/supabase'

const loginSchema = z.object({
  email: z.string().email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe sua senha.'),
})

type LoginFields = z.infer<typeof loginSchema>

export function LoginPage() {
  const { signIn, session, profile, loading, authError } = useAuth()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFields>({ resolver: zodResolver(loginSchema) })

  if (!loading && session && profile) return <Navigate to="/" replace />

  async function onSubmit(fields: LoginFields) {
    setSubmitError(null)
    try {
      await signIn(fields.email, fields.password)
      navigate('/', { replace: true })
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Não foi possível entrar. Tente novamente.',
      )
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <section className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Entrar no Caderno Inteligente</h1>
          <p className="text-sm text-muted-foreground">
            Acesse sua conta de aluno ou responsável.
          </p>
        </header>

        {!isSupabaseConfigured && (
          <p className="rounded-lg bg-warning/20 p-3 text-sm" role="status">
            Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em .env.local para
            habilitar o login.
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

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <label className="block space-y-1.5 text-sm font-medium">
            E-mail
            <input
              autoComplete="email"
              className="w-full rounded-lg border bg-background px-3 py-2.5 font-normal"
              type="email"
              {...register('email')}
            />
            {errors.email && (
              <span className="text-destructive" role="alert">
                {errors.email.message}
              </span>
            )}
          </label>
          <label className="block space-y-1.5 text-sm font-medium">
            Senha
            <input
              autoComplete="current-password"
              className="w-full rounded-lg border bg-background px-3 py-2.5 font-normal"
              type="password"
              {...register('password')}
            />
            {errors.password && (
              <span className="text-destructive" role="alert">
                {errors.password.message}
              </span>
            )}
          </label>
          <button
            className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting || !isSupabaseConfigured}
            type="submit"
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

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
