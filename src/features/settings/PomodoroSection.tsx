import { useLiveQuery } from 'dexie-react-hooks'
import clsx from 'clsx'
import { availabilityRepo } from '@/services/db/repositories'
import { Card } from '@/components/ui/Card'
import { Input, Label } from '@/components/ui/Field'

const PRESETS = [
  { label: '25 / 5', study: 25, rest: 5 },
  { label: '50 / 10', study: 50, rest: 10 },
  { label: '90 / 15', study: 90, rest: 15 },
]

export function PomodoroSection() {
  const availability = useLiveQuery(() => availabilityRepo.get(), [])
  if (!availability) return null

  const { preferredSessionMinutes: study, breakMinutes: rest } = availability

  return (
    <Card>
      <h3 className="font-medium text-ink">Pomodoro</h3>
      <p className="mt-1 text-sm text-muted">
        Cuánto dura una sesión de estudio y cuánto el descanso entre una y otra.
      </p>

      <div className="mt-3 flex gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => void availabilityRepo.update({ preferredSessionMinutes: p.study, breakMinutes: p.rest })}
            className={clsx(
              'flex-1 rounded-xl border px-3 py-2 text-sm font-medium',
              study === p.study && rest === p.rest
                ? 'border-accent bg-accent-soft text-accent-ink'
                : 'border-border text-muted hover:bg-surface-raised',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <Label>Tiempo de estudio (min)</Label>
          <Input
            type="number"
            min={5}
            step={5}
            value={study}
            onChange={(e) => void availabilityRepo.update({ preferredSessionMinutes: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label>Tiempo de descanso (min)</Label>
          <Input
            type="number"
            min={0}
            step={5}
            value={rest}
            onChange={(e) => void availabilityRepo.update({ breakMinutes: Number(e.target.value) })}
          />
        </div>
      </div>
    </Card>
  )
}
