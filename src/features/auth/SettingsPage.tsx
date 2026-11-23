import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/features/auth/useAuth'

export function SettingsPage() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSignOut() {
    setErrorMessage(null)
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('[auth] Não foi possível encerrar a sessão.', error)
      setErrorMessage('Não foi possível sair. Tente novamente.')
    }
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="mt-1 text-muted-foreground">Gerencie sua conta e aparência.</p>
      </header>

      <div className="space-y-4 rounded-2xl border bg-card p-5 text-card-foreground">
        <h2 className="font-semibold">Minha conta</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Nome</dt>
            <dd>{profile?.full_name || 'Não informado'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Usuário</dt>
            <dd>{profile?.username || 'Não informado'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Perfil</dt>
            <dd>
              {profile?.role === 'student'
                ? 'Aluno'
                : profile?.role === 'tutor'
                  ? 'Tutor'
                  : 'Pai ou responsável'}
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex items-center justify-between rounded-2xl border bg-card p-5 text-card-foreground">
        <div>
          <h2 className="font-semibold">Aparência</h2>
          <p className="text-sm text-muted-foreground">Alternar tema claro ou escuro.</p>
        </div>
        <ThemeToggle />
      </div>

      {errorMessage && (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      )}
      <button
        className="rounded-lg border px-4 py-2 font-medium hover:bg-muted"
        onClick={() => void handleSignOut()}
        type="button"
      >
        Sair da conta
      </button>
    </section>
  )
}
