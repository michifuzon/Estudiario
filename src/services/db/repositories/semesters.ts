import { db } from '../client'
import { createRepository } from './base'
import { semesterMapper } from '../../supabase/entityMappers'
import type { Semester } from '../../../types/domain'

const base = createRepository<Semester>(db.semesters, 'semesters', {
  tableName: 'semesters',
  toRow: semesterMapper.toRow,
})

export const semestersRepo = {
  ...base,
  async listActive(): Promise<Semester[]> {
    const all = await base.list()
    return all.filter((s) => !s.isArchived).sort((a, b) => a.name.localeCompare(b.name))
  },
  async archive(id: string): Promise<Semester> {
    return base.update(id, { isArchived: true })
  },

  /** Devuelve el primer semestre activo, o crea uno genérico si todavía no existe ninguno. */
  async ensureDefault(): Promise<Semester> {
    const active = await semestersRepo.listActive()
    if (active.length) return active[0]
    return base.create({
      name: 'Semestre actual',
      startDate: null,
      endDate: null,
      isArchived: false,
    })
  },
}
