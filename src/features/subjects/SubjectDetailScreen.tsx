import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
import clsx from 'clsx'
import { ChevronLeft, Pencil } from 'lucide-react'
import { subjectsRepo } from '@/services/db/repositories'
import { SubjectFormSheet } from './SubjectFormSheet'

const TABS = [
  { to: '', label: 'Resumen' },
  { to: 'chat', label: 'Chat' },
  { to: 'archivos', label: 'Archivos' },
  { to: 'calificaciones', label: 'Calificaciones' },
  { to: 'plan', label: 'Plan' },
]

export function SubjectDetailScreen() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const navigate = useNavigate()
  const subject = useLiveQuery(() => (subjectId ? subjectsRepo.get(subjectId) : undefined), [subjectId])
  const [editOpen, setEditOpen] = useState(false)

  if (subject === undefined) return null
  if (subject === null || (subject && !subject.id)) {
    return <p className="p-6 text-sm text-muted">Materia no encontrada.</p>
  }

  return (
    <div>
      <div className="border-b border-border px-4 pb-4 pt-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/materias')} className="rounded-full p-1.5 text-muted hover:bg-accent-soft">
            <ChevronLeft size={20} />
          </button>
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: subject.color }} />
          <h1 className="min-w-0 flex-1 truncate text-xl">{subject.name}</h1>
          <button onClick={() => setEditOpen(true)} className="rounded-full p-1.5 text-muted hover:bg-accent-soft">
            <Pencil size={18} />
          </button>
        </div>

        <div className="no-scrollbar mt-4 flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === ''}
              className={({ isActive }) =>
                clsx(
                  'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-accent text-white' : 'text-muted hover:bg-accent-soft',
                )
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="px-4 py-5">
        <Outlet context={{ subject }} />
      </div>

      <SubjectFormSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        subject={subject}
        onDeleted={() => navigate('/materias')}
      />
    </div>
  )
}
