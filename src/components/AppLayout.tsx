import { useState } from 'react'
import { BookOpen, LogOut } from 'lucide-react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { NotificationBell } from '@/components/NotificationBell'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/features/auth/useAuth'

function getInitials(name: string | null, username: string | null) {
  const label = name?.trim() || username?.trim() || '?'
  return label
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toLocaleUpperCase('pt-BR'))
    .join('')
}

export function AppLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [signOutError, setSignOutError] = useState<string | null>(null)

  async function handleSignOut() {
    setSignOutError(null)
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('[auth] Não foi possível encerrar a sessão.', error)
      setSignOutError('Não foi possível sair. Tente novamente.')
    }
  }

  if (!profile) return null

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link className="flex min-w-0 items-center gap-2 font-semibold" to="/">
            <BookOpen aria-hidden className="shrink-0 text-primary" size={22} />
            <span className="truncate">Caderno Inteligente</span>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <ThemeToggle />
            <Link
              aria-label="Configurações da conta"
              className="grid size-10 place-items-center overflow-hidden rounded-full border bg-muted font-medium text-sm"
              to="/settings"
              title={profile.full_name ?? profile.username ?? 'Minha conta'}
            >
              {profile.avatar_url ? (
                <img
                  alt=""
                  className="size-full object-cover"
                  src={profile.avatar_url}
                />
              ) : (
                getInitials(profile.full_name, profile.username)
              )}
            </Link>
            <button
              aria-label="Sair"
              className="grid size-10 place-items-center rounded-full border hover:bg-muted"
              onClick={() => void handleSignOut()}
              title="Sair"
              type="button"
            >
              <LogOut aria-hidden size={18} />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl p-4 sm:p-6">
        {signOutError && (
          <p className="mb-4 text-sm text-destructive" role="alert">
            {signOutError}
          </p>
        )}
        <Outlet />
      </main>
    </div>
  )
}
