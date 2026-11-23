import type { ReactNode } from 'react'
import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import type { UserRole } from '@/types/auth'

interface RoleGuardProps {
  allowed?: UserRole | readonly UserRole[]
  children?: ReactNode
}

export function RoleGuard({ allowed, children }: RoleGuardProps) {
  const { authenticated, profile, loading, authError, signOut } = useAuth()
  const [signOutError, setSignOutError] = useState<string | null>(null)

  if (loading) {
    return (
      <main className="grid min-h-dvh place-items-center p-6" aria-live="polite">
        <p className="text-muted-foreground">Carregando sua conta...</p>
      </main>
    )
  }

  if (!authenticated) return <Navigate to="/login" replace />

  if (authError || !profile) {
    return (
      <main className="grid min-h-dvh place-items-center p-6">
        <section className="w-full max-w-md space-y-4 rounded-xl border bg-card p-6 text-card-foreground">
          <p role="alert">
            {authError ?? 'Não foi possível carregar seu perfil. Tente novamente.'}
          </p>
          {signOutError && <p role="alert">{signOutError}</p>}
          <button
            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
            onClick={() => {
              setSignOutError(null)
              void signOut().catch((error: unknown) => {
                console.error('[auth] Não foi possível encerrar a sessão.', error)
                setSignOutError('Não foi possível sair. Tente novamente.')
              })
            }}
            type="button"
          >
            Voltar ao login
          </button>
        </section>
      </main>
    )
  }

  const roles = allowed ? (Array.isArray(allowed) ? allowed : [allowed]) : null
  if (roles && !roles.includes(profile.role)) return <Navigate to="/" replace />

  return children ? children : <Outlet />
}
