import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '@/features/auth/useAuth'
import { isSupabaseConfigured } from '@/lib/supabase'

const signupSchema = z.object({
  fullName: z.string().trim().min(2, 'Informe seu nome completo.'),
  email: z.string().email('Informe um e-mail válido.'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
  role: z.enum(['student', 'parent']),
})

type SignupFields = z.infer<typeof signupSchema>

export function SignupPage() {
  const { signUp, session, profile, loading } = useAuth()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFields>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: 'student' },
  })

  if (!loading && session && profile) return <Navigate to="/" replace />

  async function onSubmit(fields: SignupFields) {
    setSubmitError(null)
    setConfirmationMessage(null)
    try {
      const needsConfirmation = await signUp(
        fields.fullName,
        fields.email,
        fields.password,
        fields.role,
      )
      if (needsConfirmation) {
        setConfirmationMessage(
          'Conta criada. Verifique seu e-mail para confirmar o cadastro antes de entrar.',
        )
      } else {
        navigate('/', { replace: true })
      }
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Não foi possível criar a conta. Tente novamente.',
      )
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <section className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Criar sua conta</h1>
          <p className="text-sm text-muted-foreground">
            Escolha o perfil que corresponde a esta conta.
          </p>
        </header>

        {!isSupabaseConfigured && (
          <p className="rounded-lg bg-warning/20 p-3 text-sm" role="status">
            Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em .env.local para
            habilitar o cadastro.
          </p>
        )}
        {submitError && (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm" role="alert">
            {submitError}
          </p>
        )}
        {confirmationMessage && (
          <p className="rounded-lg bg-success/15 p-3 text-sm" role="status">
            {confirmationMessage}
          </p>
        )}

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <label className="block space-y-1.5 text-sm font-medium">
            Nome completo
            <input
              autoComplete="name"
              className="w-full rounded-lg border bg-background px-3 py-2.5 font-normal"
              {...register('fullName')}
            />
            {errors.fullName && (
              <span className="text-destructive" role="alert">
                {errors.fullName.message}
              </span>
            )}
          </label>
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
              autoComplete="new-password"
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
          <label className="block space-y-1.5 text-sm font-medium">
            Perfil
            <select
              className="w-full rounded-lg border bg-background px-3 py-2.5 font-normal"
              {...register('role')}
            >
              <option value="student">Aluno</option>
              <option value="parent">Pai ou responsável</option>
            </select>
            {errors.role && (
              <span className="text-destructive" role="alert">
                Escolha um perfil válido.
              </span>
            )}
          </label>
          <button
            className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting || !isSupabaseConfigured}
            type="submit"
          >
            {isSubmitting ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

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
