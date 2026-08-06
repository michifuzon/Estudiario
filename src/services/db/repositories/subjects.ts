import { db } from '../client'
import { createRepository } from './base'
import { subjectMapper } from '../../supabase/entityMappers'
import type { Subject } from '../../../types/domain'

const base = createRepository<Subject>(db.subjects, 'subjects', {
  tableName: 'subjects',
  toRow: subjectMapper.toRow,
})

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
