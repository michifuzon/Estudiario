import { addDays, differenceInCalendarDays, formatISO } from 'date-fns'
import { DIFFICULTY_LABEL, DIFFICULTY_WEIGHT } from '@/types/domain'
import type { AvailabilitySettings, Difficulty, EventItem, ImportanceLevel, Subject } from '@/types/domain'

const BASE_SESSION_COUNT: Record<Difficulty, number> = { 1: 3, 2: 5, 3: 7, 4: 9 }

export interface UrgencyInput {
  difficulty: Difficulty
  daysUntilExam: number
  topicsCount: number
  averageGrade: number | null
  overdueSessions: number
  importance: ImportanceLevel
}

export interface UrgencyResult {
  score: number
  reasoning: string
}

/**
 * prioridad = dificultad + cercanía + cantidad de contenido + bajo rendimiento + atraso
 * (ver "Lógica inicial para distribuir el estudio" en el plan). Los pesos son
 * ajustables a mano acá — no hay nada mágico ni oculto en la fórmula.
 */
export function computeUrgency(input: UrgencyInput): UrgencyResult {
  const difficultyScore = DIFFICULTY_WEIGHT[input.difficulty]

  const closenessScore =
    input.daysUntilExam <= 3 ? 3 : input.daysUntilExam <= 7 ? 2 : input.daysUntilExam <= 14 ? 1 : 0

  const contentScore = input.topicsCount >= 5 ? 1 : input.topicsCount >= 2 ? 0.5 : 0

  const lowPerformanceScore =
    input.averageGrade !== null ? (input.averageGrade < 6 ? 1.5 : input.averageGrade < 7 ? 0.75 : 0) : 0.5 // sin notas todavía: prudencia media

  const overdueScore = Math.min(input.overdueSessions * 0.5, 2)

  const importanceScore = (input.importance - 1) * 0.5

  const score =
    difficultyScore + closenessScore + contentScore + lowPerformanceScore + overdueScore + importanceScore

  const reasons: string[] = [`está marcada como ${DIFFICULTY_LABEL[input.difficulty].toLowerCase()}`]
  if (input.daysUntilExam <= 14) reasons.push(`faltan ${input.daysUntilExam} días para el examen`)
  if (input.averageGrade !== null && input.averageGrade < 7) {
    reasons.push(`tu promedio actual es ${input.averageGrade.toFixed(1)}`)
  }
  if (input.overdueSessions > 0) {
    reasons.push(`tenés ${input.overdueSessions} sesión${input.overdueSessions > 1 ? 'es' : ''} atrasada${input.overdueSessions > 1 ? 's' : ''}`)
  }

  return { score: Math.round(score * 10) / 10, reasoning: reasons.join(', ') }
}

export interface SessionDraft {
  topic: string
  objective: string
  date: string
  durationMinutes: number
  priority: number
  reasoning: string
}

function buildSessionObjectives(topicsRaw: string, sessionCount: number): { topic: string; objective: string }[] {
  const topics = topicsRaw
    .split(/[,;\n]/)
    .map((t) => t.trim())
    .filter(Boolean)
  const topicList = topics.length ? topics : ['el temario']

  const reviewSlots = sessionCount >= 5 ? 2 : sessionCount >= 3 ? 1 : 0
  const workingSlots = Math.max(sessionCount - reviewSlots, 0)

  const items: { topic: string; objective: string }[] = []
  for (let i = 0; i < workingSlots; i++) {
    const topic = topicList[i % topicList.length]
    const phase = Math.floor(i / topicList.length)
    if (phase === 0) items.push({ topic, objective: `Leer teoría de ${topic}` })
    else if (phase === 1) items.push({ topic, objective: `Resolver ejercicios de ${topic}` })
    else items.push({ topic, objective: `Repasar errores de ${topic}` })
  }
  if (reviewSlots >= 1) items.push({ topic: 'Repaso general', objective: 'Simulacro o parcial de práctica' })
  if (reviewSlots >= 2) items.push({ topic: 'Repaso general', objective: 'Repaso liviano antes del examen' })

  return items.slice(0, sessionCount)
}

export interface GeneratePlanParams {
  subject: Subject
  event: EventItem
  availability: AvailabilitySettings
  averageGrade: number | null
  overdueSessions?: number
  today?: Date
}

/** Genera el borrador de sesiones para un examen concreto. No las guarda: eso lo hace quien llama. */
export function generateStudyPlanForEvent(params: GeneratePlanParams): SessionDraft[] {
  const today = params.today ?? new Date()
  const examDate = new Date(`${params.event.date}T00:00:00`)
  const daysUntilExam = Math.max(differenceInCalendarDays(examDate, today), 1)

  // Con cuántos días de anticipación arrancar a estudiar esta materia según
  // su dificultad (configurable en Ajustes → Plan de estudio). Si el examen
  // está más cerca que eso, usamos lo que realmente queda; nunca inventamos
  // días que no existen.
  const anticipationDays = params.availability.anticipationDaysByDifficulty?.[params.subject.difficulty] ?? 14
  const availableDays = Math.max(Math.min(daysUntilExam - 1, anticipationDays), 1)
  const windowStartOffset = daysUntilExam - availableDays
  const windowEndOffset = daysUntilExam - 1
  const windowSpan = Math.max(windowEndOffset - windowStartOffset, 0)

  const topicsCount = params.event.topics.split(/[,;\n]/).filter((t) => t.trim()).length

  const { score, reasoning } = computeUrgency({
    difficulty: params.subject.difficulty,
    daysUntilExam,
    topicsCount,
    averageGrade: params.averageGrade,
    overdueSessions: params.overdueSessions ?? 0,
    importance: params.event.importance,
  })

  const baseCount = BASE_SESSION_COUNT[params.subject.difficulty]
  const sessionCount = Math.max(1, Math.min(baseCount, availableDays))

  const objectives = buildSessionObjectives(params.event.topics, sessionCount)
  const duration = Math.min(params.availability.preferredSessionMinutes, params.availability.maxDailyMinutes)

  const fullReasoning = `${params.subject.name} recibió ${sessionCount} sesiones porque ${reasoning}.`

  return objectives.map((item, index) => {
    const dayOffset =
      index === objectives.length - 1
        ? windowEndOffset
        : windowStartOffset + Math.max(0, Math.round(((index + 1) * windowSpan) / objectives.length))
    return {
      topic: item.topic,
      objective: item.objective,
      date: formatISO(addDays(today, dayOffset), { representation: 'date' }),
      durationMinutes: duration,
      priority: score,
      reasoning: fullReasoning,
    }
  })
}
