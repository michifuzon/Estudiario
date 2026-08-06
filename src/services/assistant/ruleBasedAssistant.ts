import { formatISO } from 'date-fns'
import { eventsRepo, gradesRepo, sessionsRepo, subjectsRepo } from '@/services/db/repositories'
import { computeAverage } from '@/lib/grades'
import { formatDaysUntil, formatMinutes } from '@/lib/format'

/**
 * Asistente "nivel 0": responde preguntas frecuentes con lógica propia sobre
 * los datos guardados, sin depender de ningún proveedor de IA. Cuando se
 * configure una clave BYOK (Configuración → Inteligencia artificial), el
 * Asistente puede delegar acá lo que no reconoce y usar el modelo para el
 * resto — ver services/ai (Etapa 2).
 */
export async function answerLocally(rawQuery: string): Promise<string | null> {
  const query = rawQuery.toLowerCase()
  const today = formatISO(new Date(), { representation: 'date' })

  if (query.includes('hoy') && (query.includes('estudiar') || query.includes('tengo'))) {
    const sessions = await sessionsRepo.listByDate(today)
    if (!sessions.length) return 'Hoy no tenés sesiones planificadas. Podés generar un plan desde un parcial en el calendario.'
    const subjects = await subjectsRepo.listActive()
    const byId = new Map(subjects.map((s) => [s.id, s]))
    return sessions
      .map((s) => `${byId.get(s.subjectId)?.name ?? 'Materia'} — ${s.objective || s.topic} (${formatMinutes(s.durationMinutes)})`)
      .join('\n')
  }

  if (query.includes('falta') && query.includes('parcial')) {
    const subjects = await subjectsRepo.listActive()
    const match = subjects.find((s) => query.includes(s.name.toLowerCase()))
    const upcoming = await eventsRepo.listUpcoming(today)
    const relevant = match ? upcoming.filter((e) => e.subjectId === match.id) : upcoming
    const exam = relevant.find((e) => e.type === 'parcial' || e.type === 'final')
    if (!exam) return match ? `No tenés un parcial próximo cargado para ${match.name}.` : 'No tenés parciales próximos cargados.'
    return `${formatDaysUntil(exam.date)} para el ${exam.title}.`
  }

  if (query.includes('priorizar') || query.includes('peor') && query.includes('nota')) {
    const subjects = await subjectsRepo.listActive()
    const withAverage = await Promise.all(
      subjects.map(async (s) => ({ subject: s, average: computeAverage(await gradesRepo.listBySubject(s.id)) })),
    )
    const sorted = withAverage
      .filter((s) => s.average !== null)
      .sort((a, b) => (a.average ?? 10) - (b.average ?? 10))
    if (!sorted.length) return 'Todavía no cargaste calificaciones para comparar materias.'
    const worst = sorted[0]
    return `${worst.subject.name} es donde tenés el promedio más bajo (${worst.average?.toFixed(1)}).`
  }

  if (query.includes('pendiente') && query.includes('tema')) {
    const sessions = await sessionsRepo.list()
    const pending = sessions.filter((s) => s.status === 'pendiente')
    if (!pending.length) return 'No tenés temas pendientes en tu plan de estudio.'
    return pending.map((s) => `• ${s.topic}`).join('\n')
  }

  return null
}
