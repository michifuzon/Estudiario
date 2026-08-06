import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, X } from 'lucide-react'
import { availabilityRepo } from '@/services/db/repositories'
import { newId } from '@/lib/record'
import { Card } from '@/components/ui/Card'
import { Input, Label, Select } from '@/components/ui/Field'
import type { WeeklyAvailabilitySlot } from '@/types/domain'

const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function AvailabilitySection() {
  const availability = useLiveQuery(() => availabilityRepo.get(), [])
  const [newWeekday, setNewWeekday] = useState(1)
  const [newStart, setNewStart] = useState('18:00')
  const [newEnd, setNewEnd] = useState('20:00')

  if (!availability) return null

  async function addSlot() {
    const slot: WeeklyAvailabilitySlot = {
      id: newId(),
      weekday: newWeekday as WeeklyAvailabilitySlot['weekday'],
      startTime: newStart,
      endTime: newEnd,
    }
    await availabilityRepo.update({ weeklySlots: [...availability!.weeklySlots, slot] })
  }

  async function removeSlot(id: string) {
    await availabilityRepo.update({ weeklySlots: availability!.weeklySlots.filter((s) => s.id !== id) })
  }

  return (
    <Card>
      <h3 className="font-medium text-ink">Disponibilidad semanal</h3>
      <p className="mt-1 text-sm text-muted">El planificador arma las sesiones dentro de estos horarios.</p>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div>
          <Label>Máximo diario</Label>
          <Input
            type="number"
            min={15}
            step={15}
            value={availability.maxDailyMinutes}
            onChange={(e) => void availabilityRepo.update({ maxDailyMinutes: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label>Sesión ideal</Label>
          <Input
            type="number"
            min={10}
            step={5}
            value={availability.preferredSessionMinutes}
            onChange={(e) => void availabilityRepo.update({ preferredSessionMinutes: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label>Descanso</Label>
          <Input
            type="number"
            min={0}
            step={5}
            value={availability.breakMinutes}
            onChange={(e) => void availabilityRepo.update({ breakMinutes: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="mt-4">
        <Label>Preferencia horaria</Label>
        <Select
          value={availability.timeOfDayPreference}
          onChange={(e) =>
            void availabilityRepo.update({
              timeOfDayPreference: e.target.value as typeof availability.timeOfDayPreference,
            })
          }
        >
          <option value="indistinto">Indistinto</option>
          <option value="mañana">Mañana</option>
          <option value="tarde">Tarde</option>
          <option value="noche">Noche</option>
        </Select>
      </div>

      <div className="mt-4">
        <Label>Bloques disponibles</Label>
        <div className="flex flex-col gap-1.5">
          {availability.weeklySlots.map((slot) => (
            <div key={slot.id} className="flex items-center justify-between rounded-xl bg-paper px-3 py-2 text-sm">
              <span className="text-ink">
                {WEEKDAYS[slot.weekday]} {slot.startTime}–{slot.endTime}
              </span>
              <button onClick={() => void removeSlot(slot.id)} className="text-subtle hover:text-danger">
                <X size={15} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap items-end gap-2">
          <Select value={newWeekday} onChange={(e) => setNewWeekday(Number(e.target.value))} className="w-32">
            {WEEKDAYS.map((w, i) => (
              <option key={w} value={i}>
                {w}
              </option>
            ))}
          </Select>
          <Input type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} className="w-28" />
          <Input type="time" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} className="w-28" />
          <button
            onClick={() => void addSlot()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent-ink"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </Card>
  )
}
