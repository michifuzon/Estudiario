import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { FieldGroup, Input, Label, Select, Textarea } from '@/components/ui/Field'
import { eventsRepo, subjectsRepo } from '@/services/db/repositories'
import { EVENT_TYPE_LABEL, type EventItem, type EventType, type ImportanceLevel } from '@/types/domain'

const EVENT_TYPES = Object.keys(EVENT_TYPE_LABEL) as EventType[]

export function EventFormSheet({
  open,
  onClose,
  defaultDate,
  event,
}: {
  open: boolean
  onClose: () => void
  defaultDate?: string
  event?: EventItem | null
}) {
  const subjects = useLiveQuery(() => subjectsRepo.listActive(), [])
  const [subjectId, setSubjectId] = useState('')
  const [type, setType] = useState<EventType>('parcial')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(defaultDate ?? '')
  const [time, setTime] = useState('')
  const [topics, setTopics] = useState('')
  const [importance, setImportance] = useState<ImportanceLevel>(2)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setSubjectId(event?.subjectId ?? '')
    setType(event?.type ?? 'parcial')
    setTitle(event?.title ?? '')
    setDate(event?.date ?? defaultDate ?? '')
    setTime(event?.time ?? '')
    setTopics(event?.topics ?? '')
    setImportance(event?.importance ?? 2)
    setNotes(event?.notes ?? '')
  }, [open, event, defaultDate])

  async function handleSubmit() {
    if (!date) return
    setSubmitting(true)
    try {
      const payload = {
        subjectId: subjectId || null,
        type,
        title: title.trim() || EVENT_TYPE_LABEL[type],
        date,
        time: time || null,
        topics,
        importance,
        notes,
        status: 'pendiente' as const,
      }
      if (event) await eventsRepo.update(event.id, payload)
      else await eventsRepo.create(payload)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={event ? 'Editar evento' : 'Nuevo evento'}>
      <FieldGroup>
        <Label>Tipo</Label>
        <Select value={type} onChange={(e) => setType(e.target.value as EventType)}>
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {EVENT_TYPE_LABEL[t]}
            </option>
          ))}
        </Select>
      </FieldGroup>

      <FieldGroup>
        <Label>Materia (opcional)</Label>
        <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          <option value="">Sin materia</option>
          {subjects?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </FieldGroup>

      <FieldGroup>
        <Label>Título</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={EVENT_TYPE_LABEL[type]} />
      </FieldGroup>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label>Fecha</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </FieldGroup>
        <FieldGroup>
          <Label>Hora (opcional)</Label>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </FieldGroup>
      </div>

      <FieldGroup>
        <Label>Temas incluidos</Label>
        <Input
          value={topics}
          onChange={(e) => setTopics(e.target.value)}
          placeholder="Unidades 1, 2 y 3"
        />
      </FieldGroup>

      <FieldGroup>
        <Label>Importancia</Label>
        <Select value={importance} onChange={(e) => setImportance(Number(e.target.value) as ImportanceLevel)}>
          <option value={1}>Baja</option>
          <option value={2}>Media</option>
          <option value={3}>Alta</option>
        </Select>
      </FieldGroup>

      <FieldGroup>
        <Label>Notas</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Indicaciones, aula, etc." />
      </FieldGroup>

      <Button className="w-full" disabled={!date || submitting} onClick={() => void handleSubmit()}>
        {submitting ? 'Guardando…' : event ? 'Guardar cambios' : 'Crear evento'}
      </Button>
    </Sheet>
  )
}
