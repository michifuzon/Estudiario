import { useLiveQuery } from 'dexie-react-hooks'
import { availabilityRepo } from '@/services/db/repositories'
import { Card } from '@/components/ui/Card'
import { Input, Label } from '@/components/ui/Field'
import { DIFFICULTY_LABEL, type Difficulty } from '@/types/domain'
import { difficultyColorVar } from '@/lib/domain-ui'

const DIFFICULTIES: Difficulty[] = [1, 2, 3, 4]

export function PlanPreferencesSection() {
  const availability = useLiveQuery(() => availabilityRepo.get(), [])
  if (!availability) return null

  async function setDays(level: Difficulty, days: number) {
    await availabilityRepo.update({
      anticipationDaysByDifficulty: { ...availability!.anticipationDaysByDifficulty, [level]: days },
    })
  }

  return (
    <Card>
      <h3 className="font-medium text-ink">Plan de estudio</h3>
      <p className="mt-1 text-sm text-muted">
        Con cuántos días de anticipación empezar a estudiar una materia antes de su parcial o
        entrega, según qué tan difícil sea. El resto (cuándo estudiar y cuánto tiempo) está arriba,
        en Preferencias de estudio.
      </p>

      <div className="mt-4 flex flex-col gap-2">
        {DIFFICULTIES.map((level) => (
          <div key={level} className="flex items-center justify-between gap-3">
            <Label>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: difficultyColorVar(level) }} />
                {DIFFICULTY_LABEL[level]}
              </span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={60}
                value={availability.anticipationDaysByDifficulty[level]}
                onChange={(e) => void setDays(level, Number(e.target.value))}
                className="w-20 text-center"
              />
              <span className="text-xs text-subtle">días</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
