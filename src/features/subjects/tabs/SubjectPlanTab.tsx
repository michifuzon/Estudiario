import { useLiveQuery } from 'dexie-react-hooks'
import { CheckCircle2, Circle, Info } from 'lucide-react'
import { useSubjectContext } from '../context'
import { sessionsRepo } from '@/services/db/repositories'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDateShort, formatMinutes } from '@/lib/format'

export function SubjectPlanTab() {
  const { subject } = useSubjectContext()
  const sessions = useLiveQuery(() => sessionsRepo.listBySubject(subject.id), [subject.id])

  const pending = sessions?.filter((s) => s.status !== 'completada') ?? []
  const completed = sessions?.filter((s) => s.status === 'completada') ?? []

  if (!sessions?.length) {
    return (
      <EmptyState
        icon={<Info size={24} />}
        title="Todavía no hay un plan de estudio"
        description="Generalo desde un parcial o entrega de esta materia, en Calendario."
      />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="mb-2 text-sm font-medium text-ink">Pendientes</h3>
        <div className="flex flex-col gap-2">
          {pending.map((s) => (
            <Card key={s.id}>
              <div className="flex items-start gap-3">
                <button onClick={() => void sessionsRepo.complete(s.id)} className="mt-0.5 shrink-0 text-subtle hover:text-success">
                  <Circle size={20} />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{s.objective || s.topic}</p>
                  <p className="mt-0.5 text-xs text-muted">{s.reasoning}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Badge tone="neutral">{formatDateShort(s.date)}</Badge>
                    <Badge tone="neutral">{formatMinutes(s.durationMinutes)}</Badge>
                    {s.origin === 'auto' && <Badge tone="accent">Automática</Badge>}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {!!completed.length && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-ink">Completadas</h3>
          <div className="flex flex-col gap-2">
            {completed.map((s) => (
              <Card key={s.id} className="opacity-60">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="shrink-0 text-success" aria-hidden="true" />
                  <p className="truncate text-sm text-ink">{s.objective || s.topic}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
