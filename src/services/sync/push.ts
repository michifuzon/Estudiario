import { supabase } from '../supabase/client'
import {
  semesterMapper,
  subjectMapper,
  eventMapper,
  sessionMapper,
  gradeMapper,
  availabilityMapper,
} from '../supabase/entityMappers'
import {
  semestersRepo,
  subjectsRepo,
  eventsRepo,
  sessionsRepo,
  gradesRepo,
  availabilityRepo,
} from '../db/repositories'

/**
 * Reenvía todo lo que ya existe en Dexie hacia Supabase. Pensado para
 * "reparar" datos que se crearon mientras el guardado remoto fallaba en
 * silencio (ver services/db/repositories/base.ts) — no borra ni duplica
 * nada, es un upsert por id.
 */
export async function pushAllLocalData(userId: string): Promise<{ pushed: number; failed: number }> {
  if (!supabase) return { pushed: 0, failed: 0 }

  let pushed = 0
  let failed = 0

  // orden importa: subjects depende de semesters; events/sessions/grades
  // dependen de subjects.
  const semesters = await semestersRepo.list()
  for (const s of semesters) {
    const { error } = await supabase.from('semesters').upsert(semesterMapper.toRow(s, userId))
    error ? failed++ : pushed++
  }

  const subjects = await subjectsRepo.list()
  for (const s of subjects) {
    const { error } = await supabase.from('subjects').upsert(subjectMapper.toRow(s, userId))
    error ? failed++ : pushed++
  }

  const events = await eventsRepo.list()
  for (const e of events) {
    const { error } = await supabase.from('events').upsert(eventMapper.toRow(e, userId))
    error ? failed++ : pushed++
  }

  const sessions = await sessionsRepo.list()
  for (const s of sessions) {
    const { error } = await supabase.from('study_sessions').upsert(sessionMapper.toRow(s, userId))
    error ? failed++ : pushed++
  }

  const grades = await gradesRepo.list()
  for (const g of grades) {
    const { error } = await supabase.from('grades').upsert(gradeMapper.toRow(g, userId))
    error ? failed++ : pushed++
  }

  const availability = await availabilityRepo.get()
  const { error: availError } = await supabase
    .from('availability')
    .upsert(availabilityMapper.toRow(availability, userId), { onConflict: 'user_id' })
  availError ? failed++ : pushed++

  return { pushed, failed }
}
