export type UserRole = 'student' | 'parent' | 'tutor'
export type ParentStudentLinkStatus = 'pending' | 'active' | 'revoked'

export interface ProfileRow {
  id: string
  username: string | null
  role: UserRole
  full_name: string | null
  email: string | null
  avatar_url: string | null
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow
        Insert: {
          id: string
          role: UserRole
          username?: string | null
          full_name?: string | null
          email?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          full_name?: string | null
          avatar_url?: string | null
        }
        Relationships: []
      }
      parent_student_links: {
        Row: {
          id: string
          parent_id: string
          student_id: string
          status: ParentStudentLinkStatus
          created_at: string
        }
        Insert: {
          id?: string
          parent_id: string
          student_id: string
          status?: ParentStudentLinkStatus
          created_at?: string
        }
        Update: {
          status?: ParentStudentLinkStatus
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      ensure_keycloak_profile: {
        Args: Record<string, never>
        Returns: ProfileRow
      }
    }
    Enums: {
      app_role: UserRole
      parent_student_link_status: ParentStudentLinkStatus
    }
    CompositeTypes: Record<string, never>
  }
}
