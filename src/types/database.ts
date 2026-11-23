export type UserRole = 'student' | 'parent'
export type ParentStudentLinkStatus = 'pending' | 'active' | 'revoked'

export interface ProfileRow {
  id: string
  username: string | null
  role: UserRole
  must_change_password: boolean
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
          must_change_password?: boolean
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
    Functions: Record<string, never>
    Enums: {
      app_role: UserRole
      parent_student_link_status: ParentStudentLinkStatus
    }
    CompositeTypes: Record<string, never>
  }
}
