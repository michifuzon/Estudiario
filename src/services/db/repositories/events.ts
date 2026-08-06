import { db } from '../client'
import { createRepository } from './base'
import type { EventItem } from '../../../types/domain'

const base = createRepository<EventItem>(db.events, 'events')

export const eventsRepo = {
  ...base,
  async listBySubject(subjectId: string): Promise<EventItem[]> {
    const all = await base.list()
    return all.filter((e) => e.subjectId === subjectId).sort((a, b) => a.date.localeCompare(b.date))
  },
  async listUpcoming(fromDateIso: string, limit?: number): Promise<EventItem[]> {
    const all = await base.list()
    const upcoming = all
      .filter((e) => e.status === 'pendiente' && e.date >= fromDateIso)
      .sort((a, b) => a.date.localeCompare(b.date))
    return typeof limit === 'number' ? upcoming.slice(0, limit) : upcoming
  },
  async listInRange(startIso: string, endIso: string): Promise<EventItem[]> {
    const all = await base.list()
    return all.filter((e) => e.date >= startIso && e.date <= endIso)
  },
}
