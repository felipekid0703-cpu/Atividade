import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Profile, UserRole } from '@/types/auth'

export interface AuthContextValue {
  session: Session | null
  profile: Profile | null
  loading: boolean
  authError: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (
    fullName: string,
    email: string,
    password: string,
    role: UserRole,
  ) => Promise<boolean>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
