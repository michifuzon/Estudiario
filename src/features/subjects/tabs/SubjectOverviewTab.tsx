import { useLiveQuery } from 'dexie-react-hooks'
import { formatISO } from 'date-fns'
import { useSubjectContext } from '../context'
import { eventsRepo, gradesRepo } from '@/services/db/repositories'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { computeAverage } from '@/lib/grades'
import { formatDateLong, formatDaysUntil } from '@/lib/format'
import { difficultyColorVar } from '@/lib/domain-ui'
import { DIFFICULTY_LABEL, EVENT_TYPE_LABEL } from '@/types/domain'

export function SubjectOverviewTab() {
  const { subject } = useSubjectContext()
  const events = useLiveQuery(
    () => eventsRepo.listUpcoming(formatISO(new Date(), { representation: 'date' })).then((all) => all.filter((e) => e.subjectId === subject.id)),
    [subject.id],
  )
  const grades = useLiveQuery(() => gradesRepo.listBySubject(subject.id), [subject.id])
  const average = grades ? computeAverage(grades) : null

  const extras = [
    subject.professors.length && {
      label: subject.professors.length > 1 ? 'Profesores/as' : 'Profesor/a',
      value: subject.professors.join(', '),
    },
    subject.location && { label: 'Aula / modalidad', value: subject.location },
    subject.schedule && { label: 'Horario', value: subject.schedule },
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <div className="flex flex-col gap-4">
      {subject.description && <p className="text-sm text-muted">{subject.description}</p>}

      <Badge dotColor={difficultyColorVar(subject.difficulty)} className="w-fit">
        Dificultad: {DIFFICULTY_LABEL[subject.difficulty]}
      </Badge>

      {!!extras.length && (
        <div className="grid grid-cols-2 gap-3">
          {extras.map((e) => (
            <InfoCard key={e.label} label={e.label} value={e.value} />
          ))}
        </div>
      )}

      <Card>
        <p className="text-sm font-medium text-ink">Promedio</p>
        <p className="mt-1 font-serif text-2xl text-ink">{average !== null ? average.toFixed(1) : 'Sin notas'}</p>
      </Card>

      <div>
        <h3 className="mb-2 text-sm font-medium text-ink">Próximas fechas</h3>
        {!events?.length ? (
          <EmptyState title="No hay fechas próximas para esta materia" />
        ) : (
          <div className="flex flex-col gap-2">
            {events.map((event) => (
              <Card key={event.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink">{event.title || EVENT_TYPE_LABEL[event.type]}</p>
                  <p className="text-xs text-muted">{formatDateLong(event.date)}</p>
                </div>
                <span className="text-xs text-subtle">{formatDaysUntil(event.date)}</span>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-xs text-subtle">{label}</p>
      <p className="mt-0.5 truncate text-sm font-medium text-ink">{value}</p>
    </Card>
  )
}
