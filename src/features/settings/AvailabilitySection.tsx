import { useLiveQuery } from 'dexie-react-hooks'
import { availabilityRepo } from '@/services/db/repositories'
import { Card } from '@/components/ui/Card'
import { Input, Label, Select } from '@/components/ui/Field'

export function AvailabilitySection() {
  const availability = useLiveQuery(() => availabilityRepo.get(), [])
  if (!availability) return null

  return (
    <Card>
      <h3 className="font-medium text-ink">Preferencias de estudio</h3>
      <p className="mt-1 text-sm text-muted">
        Dos datos simples para que el plan automático no te proponga días imposibles. Nada de armar un
        horario semanal a mano.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <Label>Máximo por día</Label>
          <Input
            type="number"
            min={15}
            step={15}
            value={availability.maxDailyMinutes}
            onChange={(e) => void availabilityRepo.update({ maxDailyMinutes: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label>Preferís estudiar</Label>
          <Select
            value={availability.timeOfDayPreference}
            onChange={(e) =>
              void availabilityRepo.update({
                timeOfDayPreference: e.target.value as typeof availability.timeOfDayPreference,
              })
            }
          >
            <option value="indistinto">Cuando sea</option>
            <option value="mañana">A la mañana</option>
            <option value="tarde">A la tarde</option>
            <option value="noche">A la noche</option>
          </Select>
        </div>
      </div>
    </Card>
  )
}
