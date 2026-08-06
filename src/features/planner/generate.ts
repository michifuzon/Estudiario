import { availabilityRepo, gradesRepo, sessionsRepo, subjectsRepo } from '@/services/db/repositories'
import { computeAverage } from '@/lib/grades'
import { generateStudyPlanForEvent } from '@/services/planner/engine'
import type { EventItem, StudySession } from '@/types/domain'

/**
 * Genera y guarda el plan de estudio para un examen/entrega concreto.
 * Usado desde el detalle de un evento y desde la pestaña Plan de una materia.
 */
export async function generatePlanForEvent(event: EventItem): Promise<StudySession[]> {
  if (!event.subjectId) throw new Error('El evento necesita una materia para generar un plan.')

  const [subject, availability, grades, existingSessions] = await Promise.all([
    subjectsRepo.get(event.subjectId),
    availabilityRepo.get(),
    gradesRepo.listBySubject(event.subjectId),
    sessionsRepo.listByEvent(event.id),
  ])
  if (!subject) throw new Error('Materia no encontrada.')

  const today = new Date()
  const overdueSessions = existingSessions.filter(
    (s) => s.status === 'pendiente' && s.date < today.toISOString().slice(0, 10),
  ).length

  const drafts = generateStudyPlanForEvent({
    subject,
    event,
    availability,
    averageGrade: computeAverage(grades),
    overdueSessions,
    today,
  })

  const created = await Promise.all(
    drafts.map((draft) =>
      sessionsRepo.create({
        subjectId: subject.id,
        eventId: event.id,
        chatMessageId: null,
        topic: draft.topic,
        objective: draft.objective,
        date: draft.date,
        durationMinutes: draft.durationMinutes,
        priority: draft.priority,
        status: 'pendiente',
        origin: 'auto',
        reasoning: draft.reasoning,
        actualMinutes: null,
        focusRating: null,
        perceivedDifficulty: null,
        notes: '',
      }),
    ),
  )
  return created
}
