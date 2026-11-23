import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import { supabase } from '@/lib/supabase'

export function ChangePasswordPage() {
  const { profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (profile && !profile.must_change_password) return <Navigate to="/" replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    if (password !== confirmation) {
      setErrorMessage('As senhas não coincidem.')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      await refreshProfile()
      navigate('/', { replace: true })
    } catch (error) {
      console.error('[auth] Não foi possível atualizar a senha.', error)
      setErrorMessage(
        'Não foi possível confirmar a troca da senha. Confira os requisitos e tente novamente.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <section className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Crie uma nova senha</h1>
          <p className="text-sm text-muted-foreground">
            Por segurança, troque a senha temporária antes de continuar. Use pelo menos 8
            caracteres.
          </p>
        </header>

        {errorMessage && (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm" role="alert">
            {errorMessage}
          </p>
        )}

        <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <label className="block space-y-1.5 text-sm font-medium">
            Nova senha
            <input
              autoComplete="new-password"
              className="w-full rounded-lg border bg-background px-3 py-2.5 font-normal"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          <label className="block space-y-1.5 text-sm font-medium">
            Confirme a nova senha
            <input
              autoComplete="new-password"
              className="w-full rounded-lg border bg-background px-3 py-2.5 font-normal"
              minLength={8}
              onChange={(event) => setConfirmation(event.target.value)}
              required
              type="password"
              value={confirmation}
            />
          </label>
          <button
            className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>
      </section>
    </main>
  )
}
