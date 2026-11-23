import type { Database, ProfileRow } from '@/types/database'

export type UserRole = Database['public']['Enums']['app_role']
export type ParentStudentLinkStatus =
  Database['public']['Enums']['parent_student_link_status']

export type Profile = ProfileRow
