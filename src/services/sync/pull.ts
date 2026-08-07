import { supabase } from '../supabase/client'
import {
  semesterMapper,
  subjectMapper,
  eventMapper,
  sessionMapper,
  gradeMapper,
  availabilityMapper,
  chatMessageMapper,
} from '../supabase/entityMappers'
import {
  semestersRepo,
  subjectsRepo,
  eventsRepo,
  sessionsRepo,
  gradesRepo,
  availabilityRepo,
  chatRepo,
} from '../db/repositories'

/**
 * Trae todo lo que ya existe en Supabase para este usuario y lo mezcla en
 * Dexie (así un dispositivo nuevo, o una cuenta reconectada, recupera lo
 * que se cargó desde otro lado). Se corre una vez apenas se confirma la
 * sesión — ver AuthProvider.
 */
export async function pullRemoteData(userId: string): Promise<void> {
  if (!supabase) return

  const [semesters, subjects, events, sessions, grades, availability, chatMessages] = await Promise.all([
    supabase.from('semesters').select('*').eq('user_id', userId),
    supabase.from('subjects').select('*').eq('user_id', userId),
    supabase.from('events').select('*').eq('user_id', userId),
    supabase.from('study_sessions').select('*').eq('user_id', userId),
    supabase.from('grades').select('*').eq('user_id', userId),
    supabase.from('availability').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('chat_messages').select('*').eq('user_id', userId),
  ])

  await Promise.all([
    ...(semesters.data ?? []).map((row) => semestersRepo.putLocal(semesterMapper.fromRow(row))),
    ...(subjects.data ?? []).map((row) => subjectsRepo.putLocal(subjectMapper.fromRow(row))),
    ...(events.data ?? []).map((row) => eventsRepo.putLocal(eventMapper.fromRow(row))),
    ...(sessions.data ?? []).map((row) => sessionsRepo.putLocal(sessionMapper.fromRow(row))),
    ...(grades.data ?? []).map((row) => gradesRepo.putLocal(gradeMapper.fromRow(row))),
    ...(chatMessages.data ?? []).map((row) => chatRepo.putLocal(chatMessageMapper.fromRow(row))),
  ])

  if (availability.data) {
    await availabilityRepo.putLocal(availabilityMapper.fromRow(availability.data))
  }
}
