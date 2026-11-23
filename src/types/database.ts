export type UserRole = 'student' | 'parent'
export type ParentStudentLinkStatus = 'pending' | 'active' | 'revoked'
export type StudentAnswerStatus = 'draft' | 'submitted' | 'reviewed'

export type ProfileRow = {
  id: string
  username: string | null
  role: UserRole
  full_name: string | null
  email: string | null
  avatar_url: string | null
  created_at: string
}

export type SubjectRow = {
  id: string
  name: string
  slug: string
  scheduled_date: string | null
  exam_date: string | null
  question_count: number
  icon: string
}

export type QuestionRow = {
  id: string
  subject_id: string
  number: number
  block: string
  statement: string
  hints: string[]
  scaffold: string | null
  created_at: string
}

export type QuestionAnswerKeyRow = {
  question_id: string
  answer_key: string
  explanation: string | null
}

export type StudentAnswerRow = {
  id: string
  student_id: string
  question_id: string
  answer_text: string
  status: StudentAnswerStatus
  self_score: number | null
  teacher_feedback: string | null
  submitted_at: string | null
  updated_at: string
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
      subjects: {
        Row: SubjectRow
        Insert: {
          id?: string
          name: string
          slug: string
          scheduled_date?: string | null
          exam_date?: string | null
          question_count: number
          icon: string
        }
        Update: {
          name?: string
          scheduled_date?: string | null
          exam_date?: string | null
          question_count?: number
          icon?: string
        }
        Relationships: []
      }
      questions: {
        Row: QuestionRow
        Insert: {
          id?: string
          subject_id: string
          number: number
          block: string
          statement: string
          hints?: string[]
          scaffold?: string | null
          created_at?: string
        }
        Update: {
          block?: string
          statement?: string
          hints?: string[]
          scaffold?: string | null
        }
        Relationships: []
      }
      question_answer_keys: {
        Row: QuestionAnswerKeyRow
        Insert: {
          question_id: string
          answer_key: string
          explanation?: string | null
        }
        Update: {
          answer_key?: string
          explanation?: string | null
        }
        Relationships: []
      }
      student_answers: {
        Row: StudentAnswerRow
        Insert: {
          id?: string
          student_id: string
          question_id: string
          answer_text?: string
          status?: StudentAnswerStatus
        }
        Update: {
          answer_text?: string
          status?: StudentAnswerStatus
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
      student_answer_status: StudentAnswerStatus
    }
    CompositeTypes: Record<string, never>
  }
}
