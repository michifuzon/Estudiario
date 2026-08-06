import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { CalendarClock, Pencil, Sparkles, Trash2 } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { eventsRepo, sessionsRepo, subjectsRepo } from '@/services/db/repositories'
import { generatePlanForEvent } from '@/features/planner/generate'
import { EVENT_TYPE_LABEL, type EventItem } from '@/types/domain'
import { eventTypeColorVar } from '@/lib/domain-ui'
import { formatDateLong, formatDaysUntil, formatMinutes } from '@/lib/format'

export function EventDetailSheet({
  event,
  onClose,
  onEdit,
}: {
  event: EventItem | null
  onClose: () => void
  onEdit: (event: EventItem) => void
}) {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const subject = useLiveQuery(
    () => (event?.subjectId ? subjectsRepo.get(event.subjectId) : undefined),
    [event?.subjectId],
  )
  const sessions = useLiveQuery(() => (event ? sessionsRepo.listByEvent(event.id) : []), [event?.id])

  if (!event) return null

  const canGeneratePlan =
    event.subjectId &&
    ['parcial', 'final', 'recuperatorio', 'entrega', 'trabajo_practico'].includes(event.type)

  async function handleGenerate() {
    if (!event) return
    setError(null)
    setGenerating(true)
    try {
      await generatePlanForEvent(event)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el plan.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleDelete() {
    if (!event) return
    await eventsRepo.remove(event.id)
    onClose()
  }

  async function handleToggleStatus() {
    if (!event) return
    await eventsRepo.update(event.id, { status: event.status === 'completado' ? 'pendiente' : 'completado' })
  }

  return (
    <Sheet open={!!event} onClose={onClose} title={EVENT_TYPE_LABEL[event.type]}>
      <div className="mb-4 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: eventTypeColorVar(event.type) }} />
        <h3 className="text-lg font-medium text-ink">{event.title}</h3>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {subject && (
          <Badge tone="accent" dotColor={subject.color}>
            {subject.name}
          </Badge>
        )}
        <Badge tone="neutral">{formatDateLong(event.date)}</Badge>
        {event.time && <Badge tone="neutral">{event.time}</Badge>}
        <Badge tone={event.status === 'completado' ? 'success' : 'neutral'}>{formatDaysUntil(event.date)}</Badge>
      </div>

      {event.topics && (
        <p className="mb-3 text-sm text-muted">
          <span className="font-medium text-ink">Temas: </span>
          {event.topics}
        </p>
      )}
      {event.notes && <p className="mb-3 text-sm text-muted">{event.notes}</p>}

      {!!sessions?.length && (
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium text-ink">Plan de estudio relacionado</p>
          <div className="flex flex-col gap-1.5">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl bg-paper px-3 py-2 text-sm">
                <span className="text-ink">{s.objective || s.topic}</span>
                <span className="text-xs text-subtle">{formatMinutes(s.durationMinutes)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      <div className="flex flex-col gap-2">
        {canGeneratePlan && !sessions?.length && (
          <Button variant="secondary" onClick={() => void handleGenerate()} disabled={generating}>
            <Sparkles size={16} />
            {generating ? 'Generando plan…' : 'Generar plan de estudio'}
          </Button>
        )}
        <Button variant="secondary" onClick={() => onEdit(event)}>
          <Pencil size={16} />
          Editar
        </Button>
        <Button variant="secondary" onClick={() => void handleToggleStatus()}>
          <CalendarClock size={16} />
          {event.status === 'completado' ? 'Marcar como pendiente' : 'Marcar como completado'}
        </Button>
        <Button variant="danger" onClick={() => void handleDelete()}>
          <Trash2 size={16} />
          Eliminar
        </Button>
      </div>
    </Sheet>
  )
}
