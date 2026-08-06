import { formatISO, endOfWeek, startOfWeek } from 'date-fns'
import { eventsRepo, gradesRepo, sessionsRepo, subjectsRepo } from '@/services/db/repositories'
import { computeAverage } from '@/lib/grades'
import { formatDateLong, formatDaysUntil, formatMinutes } from '@/lib/format'
import { EVENT_TYPE_LABEL } from '@/types/domain'

export const HELP_TEXT = `Puedo responder cosas como:
• "¿Qué tengo que estudiar hoy?"
• "¿Cuánto falta para el parcial de Física?"
• "¿Qué materia debería priorizar?"
• "¿Cuál es mi promedio?"
• "¿Qué tengo esta semana?"
• "¿Qué materias tengo?"
• "¿Qué temas me quedan pendientes?"
• "¿Cómo viene mi semana?"

Si cargás tu propia clave de IA en Configuración, también puedo agendar parciales y entregas por texto o por foto.`

/**
 * Asistente "nivel 0": responde preguntas frecuentes con lógica propia sobre
 * los datos guardados, sin depender de ningún proveedor de IA. Cuando se
 * configure una clave BYOK (Configuración → Inteligencia artificial), el
 * Asistente puede delegar acá lo que no reconoce y usar el modelo para el
 * resto — ver services/ai.
 */
export async function answerLocally(rawQuery: string): Promise<string | null> {
  const query = rawQuery.toLowerCase().trim()
  const today = formatISO(new Date(), { representation: 'date' })

  if (
    /\b(ayuda|help)\b/.test(query) ||
    query.includes('qué podés hacer') ||
    query.includes('que podes hacer') ||
    query.includes('qué podrías responder') ||
    query.includes('que podrias responder') ||
    query.includes('qué sabés hacer') ||
    query.includes('que sabes hacer') ||
    query.includes('para qué servís') ||
    query.includes('para que servis') ||
    query.includes('qué sos') ||
    query.includes('que sos')
  ) {
    return HELP_TEXT
  }

  if (/^(hola|buenas|buen día|buen dia|hey)\b/.test(query)) {
    return 'Hola. ' + HELP_TEXT
  }

  if ((query.includes('hoy') || query.includes('ahora')) && (query.includes('estudiar') || query.includes('hago') || query.includes('tengo'))) {
    const sessions = await sessionsRepo.listByDate(today)
    if (!sessions.length) return 'Hoy no tenés sesiones planificadas. Podés generar un plan desde un parcial en el calendario.'
    const subjects = await subjectsRepo.listActive()
    const byId = new Map(subjects.map((s) => [s.id, s]))
    return sessions
      .map((s) => `${byId.get(s.subjectId)?.name ?? 'Materia'} — ${s.objective || s.topic} (${formatMinutes(s.durationMinutes)})`)
      .join('\n')
  }

  if (query.includes('falta') && (query.includes('parcial') || query.includes('examen') || query.includes('final') || query.includes('entrega'))) {
    const subjects = await subjectsRepo.listActive()
    const match = subjects.find((s) => query.includes(s.name.toLowerCase()))
    const upcoming = await eventsRepo.listUpcoming(today)
    const relevant = match ? upcoming.filter((e) => e.subjectId === match.id) : upcoming
    const exam = relevant.find((e) => e.type === 'parcial' || e.type === 'final' || e.type === 'entrega')
    if (!exam) return match ? `No tenés fechas próximas cargadas para ${match.name}.` : 'No tenés parciales ni entregas próximas cargadas.'
    return `${formatDaysUntil(exam.date)} para ${exam.title} (${formatDateLong(exam.date)}).`
  }

  if (query.includes('priorizar') || (query.includes('peor') && (query.includes('nota') || query.includes('promedio')))) {
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

  if (query.includes('promedio') && !query.includes('peor')) {
    const subjects = await subjectsRepo.listActive()
    const withAverage = await Promise.all(
      subjects.map(async (s) => ({ subject: s, average: computeAverage(await gradesRepo.listBySubject(s.id)) })),
    )
    const scored = withAverage.filter((s) => s.average !== null)
    if (!scored.length) return 'Todavía no cargaste calificaciones.'
    const overall = scored.reduce((sum, s) => sum + (s.average ?? 0), 0) / scored.length
    return (
      `Tu promedio general es ${overall.toFixed(1)}.\n` +
      scored.map((s) => `• ${s.subject.name}: ${s.average?.toFixed(1)}`).join('\n')
    )
  }

  if (query.includes('pendiente') && query.includes('tema')) {
    const sessions = await sessionsRepo.list()
    const pending = sessions.filter((s) => s.status === 'pendiente')
    if (!pending.length) return 'No tenés temas pendientes en tu plan de estudio.'
    return pending.map((s) => `• ${s.topic}`).join('\n')
  }

  if (query.includes('materia') && (query.includes('qué tengo') || query.includes('que tengo') || query.includes('cuáles') || query.includes('cuales') || query.includes('cuántas') || query.includes('cuantas'))) {
    const subjects = await subjectsRepo.listActive()
    if (!subjects.length) return 'Todavía no cargaste ninguna materia.'
    return subjects.map((s) => `• ${s.name}`).join('\n')
  }

  if (query.includes('semana') && (query.includes('qué tengo') || query.includes('que tengo') || query.includes('cómo viene') || query.includes('como viene') || query.includes('cómo voy') || query.includes('como voy'))) {
    const weekStart = formatISO(startOfWeek(new Date(), { weekStartsOn: 1 }), { representation: 'date' })
    const weekEnd = formatISO(endOfWeek(new Date(), { weekStartsOn: 1 }), { representation: 'date' })
    const [events, sessions] = await Promise.all([
      eventsRepo.listInRange(weekStart, weekEnd),
      sessionsRepo.listInRange(weekStart, weekEnd),
    ])
    const pendingEvents = events.filter((e) => e.status === 'pendiente')
    const completedMinutes = sessions
      .filter((s) => s.status === 'completada')
      .reduce((sum, s) => sum + (s.actualMinutes ?? s.durationMinutes), 0)
    const plannedMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0)
    const lines = [`Esta semana: ${formatMinutes(completedMinutes)} completadas de ${formatMinutes(plannedMinutes)} planificadas.`]
    if (pendingEvents.length) {
      lines.push('Fechas pendientes: ' + pendingEvents.map((e) => `${e.title} (${EVENT_TYPE_LABEL[e.type]})`).join(', '))
    }
    return lines.join('\n')
  }

  return null
}
