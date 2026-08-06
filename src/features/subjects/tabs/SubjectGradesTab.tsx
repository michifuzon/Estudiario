import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus } from 'lucide-react'
import { useSubjectContext } from '../context'
import { gradesRepo } from '@/services/db/repositories'
import { computeAverage, requiredScoreForTarget } from '@/lib/grades'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDateShort } from '@/lib/format'
import { GradeFormSheet } from '../grades/GradeFormSheet'

const STATUS_TONE = { aprobado: 'success', desaprobado: 'danger', pendiente: 'neutral' } as const

export function SubjectGradesTab() {
  const { subject } = useSubjectContext()
  const grades = useLiveQuery(() => gradesRepo.listBySubject(subject.id), [subject.id])
  const [formOpen, setFormOpen] = useState(false)

  const average = grades ? computeAverage(grades) : null
  const requiredForSeven = grades ? requiredScoreForTarget(grades, 7) : null

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-subtle">Promedio actual</p>
          <p className="font-serif text-3xl text-ink">{average !== null ? average.toFixed(1) : '—'}</p>
        </div>
        <Button size="icon" onClick={() => setFormOpen(true)} aria-label="Agregar calificación">
          <Plus size={18} />
        </Button>
      </div>

      {average !== null && average < 7 && requiredForSeven !== null && (
        <Card className="mb-4 bg-accent-soft/50">
          <p className="text-sm text-ink">
            Necesitás un <strong>{requiredForSeven}</strong> en tu próxima evaluación para llegar a un promedio de 7.
          </p>
        </Card>
      )}

      {!grades?.length ? (
        <EmptyState title="Todavía no cargaste calificaciones" />
      ) : (
        <div className="flex flex-col gap-2">
          {grades.map((g) => (
            <Card key={g.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">{g.name}</p>
                <p className="text-xs text-muted">{formatDateShort(g.date)}</p>
              </div>
              <div className="flex items-center gap-2">
                {g.score !== null && (
                  <span className="text-sm font-medium text-ink">
                    {g.score}/{g.maxScore}
                  </span>
                )}
                <Badge tone={STATUS_TONE[g.status]}>{g.status}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      <GradeFormSheet open={formOpen} onClose={() => setFormOpen(false)} subjectId={subject.id} />
    </div>
  )
}
