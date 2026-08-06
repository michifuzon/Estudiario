import { db } from '../client'
import { createRepository } from './base'
import type { Subject } from '../../../types/domain'

const base = createRepository<Subject>(db.subjects, 'subjects')

export const subjectsRepo = {
  ...base,
  async listBySemester(semesterId: string): Promise<Subject[]> {
    const all = await base.list()
    return all.filter((s) => s.semesterId === semesterId)
  },
  async listActive(): Promise<Subject[]> {
    const all = await base.list()
    return all.filter((s) => s.status !== 'archivada')
  },
}
