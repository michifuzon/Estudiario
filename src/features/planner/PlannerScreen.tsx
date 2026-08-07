import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { RefreshCcw, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatISO } from 'date-fns'
import { eventsRepo, sessionsRepo, subjectsRepo } from '@/services/db/repositories'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDateLong, formatDaysUntil, formatMinutes } from '@/lib/format'
import { rescheduleOverdueSessions } from '@/services/planner/reschedule'
import { generatePlanForEvent } from './generate'
import { EVENT_TYPE_LABEL, type EventType } from '@/types/domain'

const PLANNABLE_TYPES: EventType[] = ['parcial', 'final', 'recuperatorio', 'entrega', 'trabajo_practico']

export function PlannerScreen() {
  const [rescheduling, setRescheduling] = useState(false)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const sessions = useLiveQuery(() => sessionsRepo.list(), [])
  const subjects = useLiveQuery(() => subjectsRepo.listActive(), [])
  const events = useLiveQuery(() => eventsRepo.listUpcoming(formatISO(new Date(), { representation: 'date' })), [])
  const subjectsById = useMemo(() => new Map((subjects ?? []).map((s) => [s.id, s])), [subjects])

  const today = new Date().toISOString().slice(0, 10)
  const pending = (sessions ?? []).filter((s) => s.status === 'pendiente').sort((a, b) => a.date.localeCompare(b.date))
  const overdueCount = pending.filter((s) => s.date < today).length

  const eventIdsWithPlan = useMemo(() => new Set((sessions ?? []).map((s) => s.eventId).filter(Boolean)), [sessions])
  const plannableEvents = useMemo(
    () =>
      (events ?? []).filter(
        (e) => e.subjectId && PLANNABLE_TYPES.includes(e.type) && !eventIdsWithPlan.has(e.id),
      ),
    [events, eventIdsWithPlan],
  )

  const grouped = useMemo(() => {
    const map = new Map<string, typeof pending>()
    for (const s of pending) {
      if (!map.has(s.date)) map.set(s.date, [])
      map.get(s.date)!.push(s)
    }
    return map
  }, [pending])

  async function handleReschedule() {
    setRescheduling(true)
    try {
      const updated = await rescheduleOverdueSessions()
      setMessage(`Reprogramamos ${updated.length} sesión${updated.length === 1 ? '' : 'es'} atrasada${updated.length === 1 ? '' : 's'}.`)
    } finally {
      setRescheduling(false)
    }
  }

  async function handleGenerate(eventId: string) {
    const event = (events ?? []).find((e) => e.id === eventId)
    if (!event) return
    setGeneratingId(eventId)
    try {
      await generatePlanForEvent(event)
    } finally {
      setGeneratingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-[28px] leading-tight">Plan de estudio</h1>
      <p className="mt-1 text-sm text-muted">
        Sesiones concretas para prepararte, generadas automáticamente a partir de tus parciales y
        entregas — no algo que armes vos a mano.
      </p>

      {!!plannableEvents.length && (
        <section className="mt-5">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-subtle">
            Todavía sin plan
          </p>
          <div className="flex flex-col gap-2">
            {plannableEvents.map((event) => {
              const subject = event.subjectId ? subjectsById.get(event.subjectId) : undefined
              return (
                <Card key={event.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {subject ? `${subject.name} — ` : ''}
                      {event.title || EVENT_TYPE_LABEL[event.type]}
                    </p>
                    <p className="text-xs text-muted">{formatDaysUntil(event.date)}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void handleGenerate(event.id)}
                    disabled={generatingId === event.id}
                  >
                    <Sparkles size={14} />
                    {generatingId === event.id ? 'Generando…' : 'Generar plan'}
                  </Button>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {overdueCount > 0 && (
        <Card className="mt-5 flex items-center justify-between gap-3 bg-warning/10">
          <p className="text-sm text-ink">
            Tenés {overdueCount} sesión{overdueCount === 1 ? '' : 'es'} atrasada{overdueCount === 1 ? '' : 's'}.
          </p>
          <Button size="sm" variant="secondary" onClick={() => void handleReschedule()} disabled={rescheduling}>
            <RefreshCcw size={14} />
            {rescheduling ? 'Reprogramando…' : 'Reprogramar'}
          </Button>
        </Card>
      )}
      {message && <p className="mt-3 text-sm text-success">{message}</p>}

      <div className="mt-5">
        {!pending.length ? (
          !plannableEvents.length && (
            <EmptyState
              title="No tenés sesiones pendientes"
              description="Cuando cargues un parcial o una entrega con materia asignada, va a aparecer acá para generarle un plan con un toque."
            />
          )
        ) : (
          <div className="flex flex-col gap-5">
            {[...grouped.entries()].map(([date, items]) => (
              <div key={date}>
                <h2 className="mb-2 text-sm font-medium capitalize text-ink">
                  {date < today ? `${formatDateLong(date)} · atrasada` : formatDateLong(date)}
                </h2>
                <div className="flex flex-col gap-2">
                  {items.map((session) => {
                    const subject = subjectsById.get(session.subjectId)
                    return (
                      <Link
                        key={session.id}
                        to={subject ? `/materias/${subject.id}/plan` : '/plan'}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">
                            {subject?.name ?? 'Materia'} — {session.objective || session.topic}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-muted">{session.reasoning}</p>
                        </div>
                        <Badge tone="neutral">{formatMinutes(session.durationMinutes)}</Badge>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
