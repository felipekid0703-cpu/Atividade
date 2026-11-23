import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { AuthContext } from '@/features/auth/AuthContext'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Profile, UserRole } from '@/types/auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const requestId = useRef(0)

  const syncSession = useCallback(async (nextSession: Session | null) => {
    const request = ++requestId.current
    setSession(nextSession)
    setProfile(null)
    setAuthError(null)

    if (!nextSession) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, full_name, email, avatar_url, created_at')
        .eq('id', nextSession.user.id)
        .maybeSingle()

      if (request !== requestId.current) return
      if (error) {
        console.error('[auth] Não foi possível carregar o perfil.', error)
        setAuthError('Não foi possível carregar seu perfil. Tente entrar novamente.')
      } else if (!data) {
        setAuthError('Seu perfil não foi encontrado. Entre em contato com o suporte.')
      } else {
        setProfile(data)
      }
    } catch (error) {
      if (request !== requestId.current) return
      console.error('[auth] Falha inesperada ao carregar o perfil.', error)
      setAuthError('Ocorreu um erro ao carregar seu perfil. Tente novamente.')
    } finally {
      if (request === requestId.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      window.setTimeout(() => {
        if (active) void syncSession(nextSession)
      }, 0)
    })

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          console.error('[auth] Não foi possível recuperar a sessão.', error)
          setAuthError('Não foi possível recuperar sua sessão. Tente entrar novamente.')
          setLoading(false)
          return
        }
        void syncSession(data.session)
      })
      .catch((error: unknown) => {
        if (!active) return
        console.error('[auth] Falha inesperada ao recuperar a sessão.', error)
        setAuthError('Ocorreu um erro ao recuperar sua sessão. Tente novamente.')
        setLoading(false)
      })

    return () => {
      active = false
      requestId.current += 1
      subscription.unsubscribe()
    }
  }, [syncSession])

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!isSupabaseConfigured) {
        throw new Error('Configure o Supabase no arquivo .env.local antes de entrar.')
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      await syncSession(data.session)
    },
    [syncSession],
  )

  const signUp = useCallback(
    async (fullName: string, email: string, password: string, role: UserRole) => {
      if (!isSupabaseConfigured) {
        throw new Error('Configure o Supabase no arquivo .env.local antes de criar a conta.')
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role } },
      })
      if (error) throw error
      if (data.session) await syncSession(data.session)
      return !data.session
    },
    [syncSession],
  )

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    await syncSession(null)
  }, [syncSession])

  return (
    <AuthContext.Provider
      value={{ session, profile, loading, authError, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}
