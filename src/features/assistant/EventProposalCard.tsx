import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Sparkles } from 'lucide-react'
import { subjectsRepo, eventsRepo } from '@/services/db/repositories'
import { generatePlanForEvent } from '@/features/planner/generate'
import { Button } from '@/components/ui/Button'
import { Input, Label, Select } from '@/components/ui/Field'
import { EVENT_TYPE_LABEL, type EventItem, type EventType } from '@/types/domain'
import type { EventProposal } from '@/services/ai/proposeEvent'

const EVENT_TYPES = Object.keys(EVENT_TYPE_LABEL) as EventType[]

export function EventProposalCard({ proposal, onDone }: { proposal: EventProposal; onDone: () => void }) {
  const subjects = useLiveQuery(() => subjectsRepo.listActive(), [])
  const [subjectId, setSubjectId] = useState('')
  const [type, setType] = useState<EventType>(proposal.eventType ?? 'parcial')
  const [title, setTitle] = useState(proposal.title || '')
  const [date, setDate] = useState(proposal.date ?? '')
  const [topics, setTopics] = useState(proposal.topics ?? '')
  const [saving, setSaving] = useState(false)
  const [createdEvent, setCreatedEvent] = useState<EventItem | null>(null)

  useEffect(() => {
    if (!subjects || !proposal.subjectGuess) return
    const guess = proposal.subjectGuess.toLowerCase()
    const match = subjects.find(
      (s) => s.name.toLowerCase().includes(guess) || guess.includes(s.name.toLowerCase()),
    )
    if (match) setSubjectId(match.id)
  }, [subjects, proposal.subjectGuess])

  if (proposal.confidence === 'baja' && !proposal.eventType && !proposal.date) {
    return (
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-border bg-surface px-3.5 py-2.5 text-sm text-muted">
        No pude identificar un evento claro ahí{proposal.notes ? `: ${proposal.notes}` : '.'}
      </div>
    )
  }

  async function handleConfirm() {
    if (!date) return
    setSaving(true)
    try {
      const event = await eventsRepo.create({
        subjectId: subjectId || null,
        type,
        title: title.trim() || EVENT_TYPE_LABEL[type],
        date,
        time: null,
        topics,
        importance: 2,
        notes: proposal.notes ?? '',
        status: 'pendiente',
      })
      setCreatedEvent(event)
    } finally {
      setSaving(false)
    }
  }

  if (createdEvent) {
    return (
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-success/30 bg-success/10 px-3.5 py-3 text-sm text-ink">
        <p>
          Listo, agregué <strong>{createdEvent.title}</strong> al calendario ({createdEvent.date}).
        </p>
        {createdEvent.subjectId && (
          <Button
            size="sm"
            variant="secondary"
            className="mt-2"
            onClick={() => void generatePlanForEvent(createdEvent).then(onDone)}
          >
            <Sparkles size={14} />
            Generar plan de estudio
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-[90%] rounded-2xl rounded-tl-sm border border-border bg-surface px-3.5 py-3 text-sm">
      <p className="mb-3 text-ink">
        {proposal.subjectGuess ? `Parece un evento de ${proposal.subjectGuess}. ` : ''}
        Revisá los datos antes de guardarlo:
      </p>

      <div className="mb-2 grid grid-cols-2 gap-2">
        <div>
          <Label>Materia</Label>
          <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">Sin materia</option>
            {subjects?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Tipo</Label>
          <Select value={type} onChange={(e) => setType(e.target.value as EventType)}>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {EVENT_TYPE_LABEL[t]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="mb-2">
        <Label>Título</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="mb-2 grid grid-cols-2 gap-2">
        <div>
          <Label>Fecha</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label>Temas</Label>
          <Input value={topics} onChange={(e) => setTopics(e.target.value)} />
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="secondary" className="flex-1" onClick={onDone}>
          Descartar
        </Button>
        <Button size="sm" className="flex-1" disabled={!date || saving} onClick={() => void handleConfirm()}>
          {saving ? 'Guardando…' : 'Confirmar'}
        </Button>
      </div>
    </div>
  )
}
