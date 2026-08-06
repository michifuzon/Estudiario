import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { FieldGroup, Input, Label, Select } from '@/components/ui/Field'
import { subjectsRepo } from '@/services/db/repositories'
import { convertMessageToEvent, convertMessageToSession } from './api'
import { EVENT_TYPE_LABEL, type ChatMessage, type EventType } from '@/types/domain'

const EVENT_TYPES = Object.keys(EVENT_TYPE_LABEL) as EventType[]

export function ConvertMessageSheet({
  message,
  kind,
  onClose,
}: {
  message: ChatMessage | null
  kind: 'evento' | 'sesion' | null
  onClose: () => void
}) {
  const subjects = useLiveQuery(() => subjectsRepo.listActive(), [])
  const [subjectId, setSubjectId] = useState('')
  const [type, setType] = useState<EventType>('parcial')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [duration, setDuration] = useState(50)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!message) return
    setSubjectId(message.subjectId ?? '')
    setTitle(message.text.slice(0, 60))
    setDate('')
  }, [message])

  const open = !!message && !!kind

  async function handleSubmit() {
    if (!message || !date) return
    setSubmitting(true)
    try {
      if (kind === 'evento') {
        await convertMessageToEvent({ messageId: message.id, subjectId: subjectId || null, type, title, date })
      } else if (kind === 'sesion' && subjectId) {
        await convertMessageToSession({ messageId: message.id, subjectId, topic: title, date, durationMinutes: duration })
      }
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={kind === 'evento' ? 'Convertir a evento' : 'Convertir a sesión de estudio'}>
      <FieldGroup>
        <Label>Materia</Label>
        <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          <option value="">Sin materia</option>
          {subjects?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </FieldGroup>

      {kind === 'evento' && (
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
      )}

      <FieldGroup>
        <Label>{kind === 'evento' ? 'Título' : 'Tema a estudiar'}</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </FieldGroup>

      <FieldGroup>
        <Label>Fecha</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </FieldGroup>

      {kind === 'sesion' && (
        <FieldGroup>
          <Label>Duración (minutos)</Label>
          <Input type="number" min={10} step={5} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
        </FieldGroup>
      )}

      <Button
        className="w-full"
        disabled={!date || submitting || (kind === 'sesion' && !subjectId)}
        onClick={() => void handleSubmit()}
      >
        {submitting ? 'Guardando…' : 'Confirmar'}
      </Button>
    </Sheet>
  )
}
