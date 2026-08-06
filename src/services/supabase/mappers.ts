import type { AdminUserStat, Profile } from '@/types/auth'

export interface ProfileRow {
  id: string
  email: string
  display_name: string
  avatar_path: string | null
  career: string
  institution: string
  created_at: string
  updated_at: string
}

export function mapProfileRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    avatarPath: row.avatar_path,
    career: row.career,
    institution: row.institution,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export interface AdminUserStatRow {
  user_id: string
  email: string
  display_name: string
  career: string
  joined_at: string
  email_confirmed: boolean
  last_sign_in_at: string | null
  subject_count: number
  event_count: number
  chat_message_count: number
}

export function mapAdminUserStatRow(row: AdminUserStatRow): AdminUserStat {
  return {
    userId: row.user_id,
    email: row.email,
    displayName: row.display_name,
    career: row.career,
    joinedAt: row.joined_at,
    emailConfirmed: row.email_confirmed,
    lastSignInAt: row.last_sign_in_at,
    subjectCount: row.subject_count,
    eventCount: row.event_count,
    chatMessageCount: row.chat_message_count,
  }
}
