import { useState } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { FieldGroup, Input, Label, Select } from '@/components/ui/Field'
import { gradesRepo } from '@/services/db/repositories'
import { formatISO } from 'date-fns'
import type { GradeStatus } from '@/types/domain'

export function GradeFormSheet({
  open,
  onClose,
  subjectId,
}: {
  open: boolean
  onClose: () => void
  subjectId: string
}) {
  const [name, setName] = useState('')
  const [score, setScore] = useState('')
  const [maxScore, setMaxScore] = useState(10)
  const [weight, setWeight] = useState(1)
  const [date, setDate] = useState(formatISO(new Date(), { representation: 'date' }))
  const [status, setStatus] = useState<GradeStatus>('pendiente')
  const [observations, setObservations] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!name.trim()) return
    setSubmitting(true)
    try {
      await gradesRepo.create({
        subjectId,
        name: name.trim(),
        score: score === '' ? null : Number(score),
        maxScore,
        weight,
        date,
        observations,
        status,
      })
      setName('')
      setScore('')
      setObservations('')
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Nueva calificación">
      <FieldGroup>
        <Label>Evaluación</Label>
        <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Primer parcial" />
      </FieldGroup>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label>Nota obtenida</Label>
          <Input type="number" step="0.01" value={score} onChange={(e) => setScore(e.target.value)} />
        </FieldGroup>
        <FieldGroup>
          <Label>Nota máxima</Label>
          <Input type="number" value={maxScore} onChange={(e) => setMaxScore(Number(e.target.value))} />
        </FieldGroup>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label>Ponderación</Label>
          <Input type="number" step="0.1" value={weight} onChange={(e) => setWeight(Number(e.target.value))} />
        </FieldGroup>
        <FieldGroup>
          <Label>Fecha</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </FieldGroup>
      </div>

      <FieldGroup>
        <Label>Estado</Label>
        <Select value={status} onChange={(e) => setStatus(e.target.value as GradeStatus)}>
          <option value="pendiente">Pendiente</option>
          <option value="aprobado">Aprobado</option>
          <option value="desaprobado">Desaprobado</option>
        </Select>
      </FieldGroup>

      <FieldGroup>
        <Label>Observaciones</Label>
        <Input value={observations} onChange={(e) => setObservations(e.target.value)} />
      </FieldGroup>

      <Button className="w-full" disabled={!name.trim() || submitting} onClick={() => void handleSubmit()}>
        {submitting ? 'Guardando…' : 'Guardar calificación'}
      </Button>
    </Sheet>
  )
}
