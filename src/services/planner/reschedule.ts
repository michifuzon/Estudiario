import { addDays, formatISO } from 'date-fns'
import { availabilityRepo, sessionsRepo } from '@/services/db/repositories'
import type { StudySession } from '@/types/domain'

function iso(d: Date) {
  return formatISO(d, { representation: 'date' })
}

/**
 * Reprogramación automática de sesiones atrasadas: las mueve al próximo día
 * disponible que no supere el máximo diario configurado. No inventa días
 * imposibles: si no entran en los próximos 30 días, se detiene ahí.
 */
export async function rescheduleOverdueSessions(): Promise<StudySession[]> {
  const availability = await availabilityRepo.get()
  const today = iso(new Date())
  const all = await sessionsRepo.list()

  const overdue = all
    .filter((s) => s.status === 'pendiente' && s.date < today)
    .sort((a, b) => b.priority - a.priority)

  const dailyLoad = new Map<string, number>()
  for (const s of all) {
    if (s.status === 'pendiente' && s.date >= today) {
      dailyLoad.set(s.date, (dailyLoad.get(s.date) ?? 0) + s.durationMinutes)
    }
  }

  const updated: StudySession[] = []
  for (const session of overdue) {
    let candidate = addDays(new Date(), 1)
    let placed = false
    for (let i = 0; i < 30; i++) {
      const candidateIso = iso(candidate)
      const load = dailyLoad.get(candidateIso) ?? 0
      if (load + session.durationMinutes <= availability.maxDailyMinutes) {
        dailyLoad.set(candidateIso, load + session.durationMinutes)
        const result = await sessionsRepo.replan(
          session.id,
          candidateIso,
          `Reprogramada automáticamente: no se había completado el ${session.date}.`,
        )
        updated.push(result)
        placed = true
        break
      }
      candidate = addDays(candidate, 1)
    }
    if (!placed) {
      // no hay lugar en 30 días: se deja como estaba para revisión manual
      continue
    }
  }
  return updated
}
