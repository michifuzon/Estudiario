import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { FieldGroup, Input, Label, Select, Textarea } from '@/components/ui/Field'
import { semestersRepo, subjectsRepo } from '@/services/db/repositories'
import { DIFFICULTY_LABEL, type Difficulty, type Subject, type SubjectStatus } from '@/types/domain'
import { SUBJECT_STATUS_LABEL } from '@/lib/domain-ui'

const COLOR_PRESETS = [
  '#355c7d',
  '#7fa58a',
  '#e7a64a',
  '#d35d5d',
  '#5c7d8a',
  '#8a7a9b',
  '#4c7a52',
  '#a2532b',
]

export function SubjectFormSheet({
  open,
  onClose,
  subject,
  onDeleted,
}: {
  open: boolean
  onClose: () => void
  subject?: Subject | null
  onDeleted?: () => void
}) {
  const [name, setName] = useState('')
  const [professor, setProfessor] = useState('')
  const [schedule, setSchedule] = useState('')
  const [location, setLocation] = useState('')
  const [color, setColor] = useState(COLOR_PRESETS[0])
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>(2)
  const [weeklyHoursTarget, setWeeklyHoursTarget] = useState(3)
  const [status, setStatus] = useState<SubjectStatus>('cursando')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(subject?.name ?? '')
    setProfessor(subject?.professor ?? '')
    setSchedule(subject?.schedule ?? '')
    setLocation(subject?.location ?? '')
    setColor(subject?.color ?? COLOR_PRESETS[0])
    setDescription(subject?.description ?? '')
    setDifficulty(subject?.difficulty ?? 2)
    setWeeklyHoursTarget(subject?.weeklyHoursTarget ?? 3)
    setStatus(subject?.status ?? 'cursando')
  }, [open, subject])

  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!subject) return
    if (!window.confirm(`Eliminar "${subject.name}" y todo lo que tiene guardado (chat, archivos, calificaciones, plan)?`)) {
      return
    }
    setDeleting(true)
    try {
      await subjectsRepo.remove(subject.id)
      onClose()
      onDeleted?.()
    } finally {
      setDeleting(false)
    }
  }

  async function handleSubmit() {
    if (!name.trim()) return
    setSubmitting(true)
    try {
      const payload = {
        name: name.trim(),
        professor,
        schedule,
        location,
        color,
        description,
        difficulty,
        weeklyHoursTarget,
        status,
      }
      if (subject) {
        await subjectsRepo.update(subject.id, payload)
      } else {
        const semester = await semestersRepo.ensureDefault()
        await subjectsRepo.create({ ...payload, semesterId: semester.id })
      }
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={subject ? 'Editar materia' : 'Nueva materia'}>
      <FieldGroup>
        <Label>Nombre</Label>
        <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Física I" />
      </FieldGroup>

      <FieldGroup>
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              aria-label={c}
              className="h-8 w-8 rounded-full"
              style={{
                backgroundColor: c,
                outline: color === c ? '2px solid var(--ink)' : 'none',
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
      </FieldGroup>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label>Profesor/a</Label>
          <Input value={professor} onChange={(e) => setProfessor(e.target.value)} />
        </FieldGroup>
        <FieldGroup>
          <Label>Aula / modalidad</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} />
        </FieldGroup>
      </div>

      <FieldGroup>
        <Label>Horarios de cursado</Label>
        <Input value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="Lun y Mié 18–20h" />
      </FieldGroup>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label>Dificultad</Label>
          <Select value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value) as Difficulty)}>
            {([1, 2, 3, 4] as Difficulty[]).map((d) => (
              <option key={d} value={d}>
                {DIFFICULTY_LABEL[d]}
              </option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label>Horas semanales</Label>
          <Input
            type="number"
            min={0}
            step={0.5}
            value={weeklyHoursTarget}
            onChange={(e) => setWeeklyHoursTarget(Number(e.target.value))}
          />
        </FieldGroup>
      </div>

      <FieldGroup>
        <Label>Estado</Label>
        <Select value={status} onChange={(e) => setStatus(e.target.value as SubjectStatus)}>
          {Object.entries(SUBJECT_STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </FieldGroup>

      <FieldGroup>
        <Label>Descripción</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </FieldGroup>

      <Button className="w-full" disabled={!name.trim() || submitting} onClick={() => void handleSubmit()}>
        {submitting ? 'Guardando…' : subject ? 'Guardar cambios' : 'Crear materia'}
      </Button>

      {subject && (
        <button
          onClick={() => void handleDelete()}
          disabled={deleting}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-medium text-danger hover:bg-danger/10"
        >
          <Trash2 size={14} />
          {deleting ? 'Eliminando…' : 'Eliminar materia'}
        </button>
      )}
    </Sheet>
  )
}
