import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  AlertCircle,
  ArrowRight,
  Camera,
  CalendarPlus,
  CheckCircle2,
  Circle,
  Inbox,
  NotebookPen,
  NotebookText,
  Timer,
} from 'lucide-react'
import { useHomeData } from './useHomeData'
import { WeekActivityChart } from './WeekActivityChart'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from '@/components/ThemeToggle'
import { sessionsRepo } from '@/services/db/repositories'
import { EVENT_TYPE_LABEL } from '@/types/domain'
import { eventTypeColorVar } from '@/lib/domain-ui'
import { formatDateLong, formatDaysUntil, formatMinutes } from '@/lib/format'
import { useQuickCaptureStore } from '@/app/providers/quickCaptureStore'

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-subtle">{children}</p>
}

export function HomeScreen() {
  const data = useHomeData()
  const openCapture = useQuickCaptureStore((s) => s.openCapture)
  const isFreshStart = data && data.subjects.length === 0

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Estudiario</p>
        <ThemeToggle />
      </div>
      <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h1 className="text-[30px] leading-tight sm:text-[32px]">Tu semana académica</h1>
        <span className="text-sm capitalize text-muted">
          {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
        </span>
      </div>

      {isFreshStart && (
        <div className="mt-6 rounded-xl bg-accent-soft p-5">
          <p className="text-lg font-bold text-accent-ink">Bienvenido/a a Estudiario</p>
          <p className="mt-1.5 text-sm text-accent-ink/80">
            Acá vas a organizar tus materias, parciales, entregas y apuntes, y vamos a armarte un
            plan de estudio según la dificultad de cada materia y el tiempo que tengas disponible.
            Para arrancar, cargá tu primera materia.
          </p>
          <Link to="/materias" className="mt-3 inline-block">
            <Button size="sm">
              <NotebookText size={15} />
              Crear tu primera materia
            </Button>
          </Link>
        </div>
      )}

      <div className="mt-7 flex overflow-hidden rounded-xl border border-border">
        <QuickAction to="/materias" icon={<NotebookPen size={17} />} label="Materia" tone="accent" />
        <QuickAction to="/calendario" icon={<CalendarPlus size={17} />} label="Evento" tone="delivery" />
        <QuickAction onClick={openCapture} icon={<Camera size={17} />} label="Captura" tone="warning" />
        <QuickAction to="/bandeja" icon={<Inbox size={17} />} label="Bandeja" tone="neutral" />
        <QuickAction to="/pomodoro" icon={<Timer size={17} />} label="Pomodoro" tone="delivery" />
      </div>

      {!!data?.pendingReviewCount && (
        <Link
          to="/bandeja"
          className="mt-5 flex items-center gap-3 rounded-xl bg-warning/10 px-4 py-3 text-sm text-ink"
        >
          <AlertCircle size={17} className="shrink-0 text-warning" />
          Tenés {data.pendingReviewCount} elemento{data.pendingReviewCount === 1 ? '' : 's'} pendiente
          {data.pendingReviewCount === 1 ? '' : 's'} de revisar.
        </Link>
      )}

      <section className="mt-9">
        <SectionLabel>Tu día de estudio</SectionLabel>
        {!data?.todaySessions.length ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted">Nada planificado para hoy.</p>
            <Link to="/plan" className="flex items-center gap-1 text-sm font-medium text-accent">
              Armar un plan <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {data.todaySessions.map((session) => {
              const subject = data.subjectsById.get(session.subjectId)
              return (
                <Link
                  key={session.id}
                  to={subject ? `/materias/${subject.id}` : '/materias'}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-sm)] hover:border-accent/40"
                >
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      void sessionsRepo.complete(session.id)
                    }}
                    aria-label="Marcar como completada"
                    className="shrink-0 text-subtle hover:text-success"
                  >
                    {session.status === 'completada' ? (
                      <CheckCircle2 size={22} className="animate-check-pop text-success" />
                    ) : (
                      <Circle size={22} />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {subject?.name ?? 'Materia'} — {session.topic}
                    </p>
                    <p className="text-xs text-muted">{session.objective || 'Sesión de estudio'}</p>
                  </div>
                  <span className="shrink-0 text-xs text-subtle">{formatMinutes(session.durationMinutes)}</span>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <section className="mt-9">
        <SectionLabel>Próximos parciales y entregas</SectionLabel>
        {!data?.upcomingEvents.length ? (
          <p className="text-sm text-muted">No hay fechas próximas cargadas.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {data.upcomingEvents.map((event) => {
              const subject = event.subjectId ? data.subjectsById.get(event.subjectId) : undefined
              return (
                <Link
                  key={event.id}
                  to={subject ? `/materias/${subject.id}` : '/calendario'}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-sm)] hover:border-accent/40"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: eventTypeColorVar(event.type) }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {subject ? `${subject.name} — ` : ''}
                      {event.title || EVENT_TYPE_LABEL[event.type]}
                    </p>
                    <p className="text-xs text-muted">{formatDateLong(event.date)}</p>
                  </div>
                  <Badge tone="accent">{formatDaysUntil(event.date)}</Badge>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {!!data?.subjectsNeedingAttention.length && (
        <section className="mt-9">
          <SectionLabel>Materias que necesitan atención</SectionLabel>
          <div className="flex flex-col gap-2">
            {data.subjectsNeedingAttention.map(({ subject, average }) => (
              <Link
                key={subject.id}
                to={`/materias/${subject.id}`}
                className="flex items-center justify-between rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-sm)] hover:border-accent/40"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-ink">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: subject.color }} />
                  {subject.name}
                </span>
                {average !== null && <Badge tone="warning">Promedio {average.toFixed(1)}</Badge>}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-9 mb-6">
        <SectionLabel>Progreso semanal</SectionLabel>
        <p className="mb-4 text-sm text-muted">
          {formatMinutes(data?.weeklyCompletedMinutes ?? 0)} completadas de{' '}
          {formatMinutes(data?.weeklyPlannedMinutes ?? 0)} planificadas
        </p>
        {data && <WeekActivityChart days={data.weekBreakdown} />}
      </section>
    </div>
  )
}

const TONE_CLASSES = {
  accent: 'text-accent',
  delivery: 'text-event-delivery',
  warning: 'text-warning',
  neutral: 'text-muted',
} as const

function QuickAction({
  to,
  onClick,
  icon,
  label,
  tone,
}: {
  to?: string
  onClick?: () => void
  icon: ReactNode
  label: string
  tone: keyof typeof TONE_CLASSES
}) {
  const content = (
    <>
      <span className={TONE_CLASSES[tone]}>{icon}</span>
      <span className="text-[13px] font-medium text-ink">{label}</span>
    </>
  )
  const className = 'flex flex-1 flex-col items-center gap-1.5 border-l border-border py-4 first:border-l-0 hover:bg-surface-raised'
  return to ? (
    <Link to={to} className={className}>
      {content}
    </Link>
  ) : (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  )
}
