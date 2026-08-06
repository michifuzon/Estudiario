import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  formatISO,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import clsx from 'clsx'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { eventsRepo, subjectsRepo } from '@/services/db/repositories'
import { EVENT_TYPE_LABEL, type EventItem } from '@/types/domain'
import { eventTypeColorVar } from '@/lib/domain-ui'
import { EventFormSheet } from './EventFormSheet'
import { EventDetailSheet } from './EventDetailSheet'

type ViewMode = 'mes' | 'semana' | 'dia'

function iso(d: Date) {
  return formatISO(d, { representation: 'date' })
}

export function CalendarScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('mes')
  const [cursor, setCursor] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(iso(new Date()))
  const [formOpen, setFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null)
  const [detailEvent, setDetailEvent] = useState<EventItem | null>(null)

  const gridStart = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 })
  const gridEnd = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 })

  const rangeStart = viewMode === 'mes' ? gridStart : startOfWeek(cursor, { weekStartsOn: 1 })
  const rangeEnd = viewMode === 'mes' ? gridEnd : endOfWeek(cursor, { weekStartsOn: 1 })

  const events = useLiveQuery(
    () => eventsRepo.listInRange(iso(rangeStart), iso(rangeEnd)),
    [iso(rangeStart), iso(rangeEnd)],
  )
  const subjects = useLiveQuery(() => subjectsRepo.listActive(), [])
  const subjectsById = useMemo(() => new Map((subjects ?? []).map((s) => [s.id, s])), [subjects])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventItem[]>()
    for (const e of events ?? []) {
      if (!map.has(e.date)) map.set(e.date, [])
      map.get(e.date)!.push(e)
    }
    return map
  }, [events])

  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd })
  const selectedDayEvents = eventsByDay.get(selectedDate) ?? []

  function goToday() {
    setCursor(new Date())
    setSelectedDate(iso(new Date()))
  }

  function shift(amount: number) {
    if (viewMode === 'mes') setCursor(addMonths(cursor, amount))
    else if (viewMode === 'semana') setCursor(addDays(cursor, amount * 7))
    else setCursor(addDays(cursor, amount))
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] leading-tight">Calendario</h1>
        <Button size="icon" onClick={() => { setEditingEvent(null); setFormOpen(true) }} aria-label="Nuevo evento">
          <Plus size={18} />
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-1 rounded-xl bg-surface-raised p-1">
        {(['mes', 'semana', 'dia'] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={clsx(
              'flex-1 rounded-lg py-1.5 text-sm font-medium capitalize transition-colors',
              viewMode === mode ? 'bg-accent text-white' : 'text-muted',
            )}
          >
            {mode}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button onClick={() => shift(-1)} className="rounded-full p-2 text-muted hover:bg-accent-soft">
          <ChevronLeft size={18} />
        </button>
        <button onClick={goToday} className="text-sm font-medium capitalize text-ink">
          {format(cursor, viewMode === 'dia' ? "EEEE d 'de' MMMM" : 'MMMM yyyy', { locale: es })}
        </button>
        <button onClick={() => shift(1)} className="rounded-full p-2 text-muted hover:bg-accent-soft">
          <ChevronRight size={18} />
        </button>
      </div>

      {viewMode !== 'dia' && (
        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-subtle">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
      )}

      {viewMode === 'mes' && (
        <div className="mt-1 grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dISO = iso(day)
            const dayEvents = eventsByDay.get(dISO) ?? []
            return (
              <button
                key={dISO}
                onClick={() => setSelectedDate(dISO)}
                className={clsx(
                  'flex h-14 flex-col items-center gap-1 rounded-xl border py-1.5 text-sm',
                  isSameMonth(day, cursor) ? 'border-border' : 'border-transparent text-subtle',
                  selectedDate === dISO && 'border-accent bg-accent-soft',
                  isToday(day) && selectedDate !== dISO && 'font-semibold text-accent',
                )}
              >
                {format(day, 'd')}
                <span className="flex gap-0.5">
                  {dayEvents.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: eventTypeColorVar(e.type) }}
                    />
                  ))}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {viewMode === 'semana' && (
        <div className="mt-3 flex flex-col gap-2">
          {days.map((day) => {
            const dISO = iso(day)
            const dayEvents = eventsByDay.get(dISO) ?? []
            return (
              <button
                key={dISO}
                onClick={() => setSelectedDate(dISO)}
                className={clsx(
                  'rounded-xl border px-3 py-2 text-left',
                  selectedDate === dISO ? 'border-accent bg-accent-soft' : 'border-border',
                )}
              >
                <p className="text-xs capitalize text-subtle">{format(day, 'EEEE d', { locale: es })}</p>
                {dayEvents.length ? (
                  <p className="text-sm text-ink">{dayEvents.map((e) => e.title).join(', ')}</p>
                ) : (
                  <p className="text-sm text-subtle">Sin eventos</p>
                )}
              </button>
            )
          })}
        </div>
      )}

      <section className="mt-6">
        <h2 className="mb-3 text-base font-medium text-ink">
          {viewMode === 'dia' ? 'Eventos del día' : format(new Date(`${selectedDate}T00:00:00`), "d 'de' MMMM", { locale: es })}
        </h2>
        {!selectedDayEvents.length ? (
          <EmptyState title="No hay eventos este día" />
        ) : (
          <div className="flex flex-col gap-2">
            {selectedDayEvents.map((event) => {
              const subject = event.subjectId ? subjectsById.get(event.subjectId) : undefined
              return (
                <button
                  key={event.id}
                  onClick={() => setDetailEvent(event)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-left"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: eventTypeColorVar(event.type) }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {subject ? `${subject.name} — ` : ''}
                      {event.title}
                    </p>
                    <p className="text-xs text-muted">
                      {EVENT_TYPE_LABEL[event.type]}
                      {event.time ? ` · ${event.time}` : ''}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>

      <EventFormSheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        defaultDate={selectedDate}
        event={editingEvent}
      />
      <EventDetailSheet
        event={detailEvent}
        onClose={() => setDetailEvent(null)}
        onEdit={(e) => { setDetailEvent(null); setEditingEvent(e); setFormOpen(true) }}
      />
    </div>
  )
}
