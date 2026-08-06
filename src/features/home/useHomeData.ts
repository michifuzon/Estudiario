import { useLiveQuery } from 'dexie-react-hooks'
import { addDays, endOfWeek, formatISO, startOfWeek } from 'date-fns'
import {
  chatRepo,
  eventsRepo,
  gradesRepo,
  sessionsRepo,
  subjectsRepo,
} from '@/services/db/repositories'
import { computeAverage } from '@/lib/grades'

function todayIso() {
  return formatISO(new Date(), { representation: 'date' })
}

export function useHomeData() {
  return useLiveQuery(async () => {
    const today = todayIso()
    const [subjects, todaySessions, upcomingEvents, pendingReview, weekSessions] = await Promise.all([
      subjectsRepo.listActive(),
      sessionsRepo.listByDate(today),
      eventsRepo.listUpcoming(today, 6),
      chatRepo.listPendingReview(),
      sessionsRepo.listInRange(
        formatISO(startOfWeek(new Date(), { weekStartsOn: 1 }), { representation: 'date' }),
        formatISO(endOfWeek(new Date(), { weekStartsOn: 1 }), { representation: 'date' }),
      ),
    ])

    const subjectsById = new Map(subjects.map((s) => [s.id, s]))

    const subjectsNeedingAttention = await Promise.all(
      subjects.map(async (subject) => {
        const grades = await gradesRepo.listBySubject(subject.id)
        const average = computeAverage(grades)
        const hasUpcomingExam = upcomingEvents.some(
          (e) => e.subjectId === subject.id && (e.type === 'parcial' || e.type === 'final'),
        )
        const needsAttention =
          subject.difficulty >= 3 && (average === null || average < 7) && (hasUpcomingExam || average !== null)
        return { subject, average, needsAttention }
      }),
    )

    const weeklyPlannedMinutes = weekSessions.reduce((sum, s) => sum + s.durationMinutes, 0)
    const weeklyCompletedMinutes = weekSessions
      .filter((s) => s.status === 'completada')
      .reduce((sum, s) => sum + (s.actualMinutes ?? s.durationMinutes), 0)

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    const weekBreakdown = Array.from({ length: 7 }, (_, i) => {
      const date = formatISO(addDays(weekStart, i), { representation: 'date' })
      const daySessions = weekSessions.filter((s) => s.date === date)
      const planned = daySessions.reduce((sum, s) => sum + s.durationMinutes, 0)
      const completed = daySessions
        .filter((s) => s.status === 'completada')
        .reduce((sum, s) => sum + (s.actualMinutes ?? s.durationMinutes), 0)
      return { date, planned, completed }
    })

    return {
      subjects,
      subjectsById,
      todaySessions,
      upcomingEvents,
      pendingReviewCount: pendingReview.length,
      subjectsNeedingAttention: subjectsNeedingAttention.filter((s) => s.needsAttention).slice(0, 3),
      todayPlannedMinutes: todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0),
      weeklyPlannedMinutes,
      weeklyCompletedMinutes,
      weekBreakdown,
    }
  }, [])
}
