import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { RefreshCcw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { sessionsRepo, subjectsRepo } from '@/services/db/repositories'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDateLong, formatMinutes } from '@/lib/format'
import { rescheduleOverdueSessions } from '@/services/planner/reschedule'

export function PlannerScreen() {
  const [rescheduling, setRescheduling] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const sessions = useLiveQuery(() => sessionsRepo.list(), [])
  const subjects = useLiveQuery(() => subjectsRepo.listActive(), [])
  const subjectsById = useMemo(() => new Map((subjects ?? []).map((s) => [s.id, s])), [subjects])

  const today = new Date().toISOString().slice(0, 10)
  const pending = (sessions ?? []).filter((s) => s.status === 'pendiente').sort((a, b) => a.date.localeCompare(b.date))
  const overdueCount = pending.filter((s) => s.date < today).length

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] leading-tight">Plan de estudio</h1>
      </div>

      {overdueCount > 0 && (
        <Card className="mt-4 flex items-center justify-between gap-3 bg-warning/10">
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
          <EmptyState
            title="No tenés sesiones pendientes"
            description="Generá un plan desde un parcial o entrega en el calendario, o desde la pestaña Plan de una materia."
          />
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
