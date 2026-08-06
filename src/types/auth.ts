export interface Profile {
  id: string
  email: string
  displayName: string
  avatarPath: string | null
  career: string
  institution: string
  createdAt: string
  updatedAt: string
}

export interface AdminUserStat {
  userId: string
  email: string
  displayName: string
  career: string
  joinedAt: string
  emailConfirmed: boolean
  lastSignInAt: string | null
  subjectCount: number
  eventCount: number
  chatMessageCount: number
}
