import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { NotebookText, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { subjectsRepo } from '@/services/db/repositories'
import { DIFFICULTY_LABEL } from '@/types/domain'
import { SUBJECT_STATUS_LABEL, difficultyColorVar } from '@/lib/domain-ui'
import { SubjectFormSheet } from './SubjectFormSheet'

export function SubjectsListScreen() {
  const subjects = useLiveQuery(() => subjectsRepo.listActive(), [])
  const [formOpen, setFormOpen] = useState(false)

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] leading-tight">Materias</h1>
        <Button size="icon" onClick={() => setFormOpen(true)} aria-label="Nueva materia">
          <Plus size={18} />
        </Button>
      </div>

      {!subjects?.length ? (
        <div className="mt-6">
          <EmptyState
            icon={<NotebookText size={20} />}
            title="Todavía no cargaste materias"
            description="Creá tu primera materia para empezar a organizar parciales, apuntes y plan de estudio."
            action={<Button onClick={() => setFormOpen(true)}>Nueva materia</Button>}
          />
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-2">
          {subjects.map((subject) => (
            <Link
              key={subject.id}
              to={`/materias/${subject.id}`}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4"
            >
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: subject.color }} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{subject.name}</p>
                <p className="truncate text-sm text-muted">
                  {subject.professors.length ? subject.professors.join(', ') : 'Sin profesor asignado'}
                  {subject.schedule ? ` · ${subject.schedule}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge dotColor={difficultyColorVar(subject.difficulty)}>{DIFFICULTY_LABEL[subject.difficulty]}</Badge>
                <span className="text-xs text-subtle">{SUBJECT_STATUS_LABEL[subject.status]}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <SubjectFormSheet open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  )
}
