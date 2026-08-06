import { db } from '../client'
import { createRepository } from './base'
import type { StudySession } from '../../../types/domain'

const base = createRepository<StudySession>(db.studySessions, 'studySessions')

export const sessionsRepo = {
  ...base,
  async listBySubject(subjectId: string): Promise<StudySession[]> {
    const all = await base.list()
    return all.filter((s) => s.subjectId === subjectId).sort((a, b) => a.date.localeCompare(b.date))
  },
  async listByDate(dateIso: string): Promise<StudySession[]> {
    const all = await base.list()
    return all
      .filter((s) => s.date === dateIso)
      .sort((a, b) => b.priority - a.priority)
  },
  async listInRange(startIso: string, endIso: string): Promise<StudySession[]> {
    const all = await base.list()
    return all.filter((s) => s.date >= startIso && s.date <= endIso)
  },
  async listByEvent(eventId: string): Promise<StudySession[]> {
    const all = await base.list()
    return all.filter((s) => s.eventId === eventId)
  },
  async replan(sessionId: string, newDate: string, reasoning: string): Promise<StudySession> {
    return base.update(sessionId, { date: newDate, status: 'pendiente', reasoning })
  },
  async complete(sessionId: string, actualMinutes?: number): Promise<StudySession> {
    return base.update(sessionId, {
      status: 'completada',
      actualMinutes: actualMinutes ?? null,
    })
  },
}
