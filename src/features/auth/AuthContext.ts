import { createContext } from 'react'
import type { Profile } from '@/types/auth'

export interface AuthContextValue {
  authenticated: boolean
  profile: Profile | null
  loading: boolean
  authError: string | null
  signIn: (username: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
