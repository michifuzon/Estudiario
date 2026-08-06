import { db } from '../client'
import { createRepository } from './base'
import { gradeMapper } from '../../supabase/entityMappers'
import type { Grade } from '../../../types/domain'

const base = createRepository<Grade>(db.grades, 'grades', {
  tableName: 'grades',
  toRow: gradeMapper.toRow,
})

export const gradesRepo = {
  ...base,
  async listBySubject(subjectId: string): Promise<Grade[]> {
    const all = await base.list()
    return all.filter((g) => g.subjectId === subjectId).sort((a, b) => a.date.localeCompare(b.date))
  },
}
