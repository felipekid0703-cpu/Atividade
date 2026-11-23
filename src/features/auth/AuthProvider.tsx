import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { AuthContext } from '@/features/auth/AuthContext'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Profile } from '@/types/auth'

const INTERNAL_LOGIN_DOMAIN = 'users.caderno.invalid'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  const loadProfile = useCallback(async (userId: string) => {
    setAuthError(null)
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (error) {
        console.error('[auth] Não foi possível carregar o perfil.', error)
        setProfile(null)
        setAuthError('Não foi possível validar seu perfil. Verifique a configuração do provedor.')
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('[auth] Falha inesperada ao carregar o perfil.', error)
      setProfile(null)
      setAuthError('Ocorreu um erro ao carregar seu perfil. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    if (!isSupabaseConfigured) {
      setAuthError('Configure o Supabase em .env.local antes de autenticar.')
      setLoading(false)
      return
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || event === 'INITIAL_SESSION') return

      setAuthenticated(Boolean(session))
      setAuthError(null)
      if (!session) {
        setProfile(null)
        setLoading(false)
        return
      }

      setLoading(true)
      window.setTimeout(() => {
        if (active) void loadProfile(session.user.id)
      }, 0)
    })

    async function loadCurrentSession() {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (!active) return
        if (error) throw error

        const session = data.session
        setAuthenticated(Boolean(session))
        if (session) {
          setLoading(true)
          await loadProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      } catch (error) {
        if (!active) return
        console.error('[auth] Não foi possível recuperar a sessão.', error)
        setAuthError('Não foi possível recuperar sua sessão. Entre novamente.')
        setAuthenticated(false)
        setProfile(null)
        setLoading(false)
      }
    }

    void loadCurrentSession()

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const signIn = useCallback(async (username: string, password: string) => {
    const normalizedUsername = username.trim().toLowerCase()
    if (!/^[a-z0-9._-]{1,30}$/.test(normalizedUsername)) {
      throw new Error('Informe um nome de usuário válido.')
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: `${normalizedUsername}@${INTERNAL_LOGIN_DOMAIN}`,
      password,
    })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  const refreshProfile = useCallback(async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error) throw error
    if (!user) throw new Error('A sessão expirou. Entre novamente.')
    await loadProfile(user.id)
  }, [loadProfile])

  return (
    <AuthContext.Provider
      value={{
        authenticated,
        profile,
        loading,
        authError,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
