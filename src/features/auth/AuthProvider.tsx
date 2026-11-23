import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { AuthContext } from '@/features/auth/AuthContext'
import {
  initializeKeycloak,
  isKeycloakConfigured,
  keycloak,
} from '@/lib/keycloak'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Profile } from '@/types/auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  const loadProfile = useCallback(async () => {
    setAuthError(null)
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('ensure_keycloak_profile')
      if (error) {
        console.error('[auth] Não foi possível carregar o perfil.', error)
        setAuthError('Não foi possível validar seu perfil. Verifique a configuração do provedor.')
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('[auth] Falha inesperada ao carregar o perfil.', error)
      setAuthError('Ocorreu um erro ao carregar seu perfil. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    async function initialize() {
      if (!isKeycloakConfigured || !isSupabaseConfigured) {
        setAuthError(
          'Configure Keycloak e Supabase em .env.local antes de autenticar.',
        )
        setLoading(false)
        return
      }

      try {
        await initializeKeycloak()
        if (!active) return

        const signedIn = Boolean(keycloak?.authenticated)
        setAuthenticated(signedIn)
        if (signedIn) await loadProfile()
      } catch (error) {
        if (!active) return
        console.error('[auth] Não foi possível inicializar a autenticação OIDC.', error)
        setAuthError('Não foi possível conectar ao serviço de autenticação.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void initialize()

    return () => {
      active = false
    }
  }, [loadProfile])

  const signIn = useCallback(async () => {
    if (!keycloak || !isKeycloakConfigured) {
      throw new Error('Configure o Keycloak no arquivo .env.local antes de entrar.')
    }
    await keycloak.login({ redirectUri: `${window.location.origin}/` })
  }, [])

  const signUp = useCallback(async () => {
    if (!keycloak || !isKeycloakConfigured) {
      throw new Error('Configure o Keycloak no arquivo .env.local antes de criar a conta.')
    }
    await keycloak.register({ redirectUri: `${window.location.origin}/` })
  }, [])

  const signOut = useCallback(async () => {
    if (!keycloak?.authenticated) return
    await keycloak.logout({ redirectUri: `${window.location.origin}/login` })
  }, [])

  return (
    <AuthContext.Provider
      value={{
        authenticated,
        profile,
        loading,
        authError,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
