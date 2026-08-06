import { db } from '../client'
import { newBaseRecord, touch } from '../../../lib/record'
import { queueChange } from '../../sync/outbox'
import { supabase } from '../../supabase/client'
import { availabilityMapper } from '../../supabase/entityMappers'
import type { AvailabilitySettings } from '../../../types/domain'

const SINGLETON_ID = 'default'

const DEFAULTS: Omit<AvailabilitySettings, keyof ReturnType<typeof newBaseRecord>> = {
  maxDailyMinutes: 180,
  preferredSessionMinutes: 50,
  breakMinutes: 10,
  timeOfDayPreference: 'indistinto',
  weeklySlots: [],
  exceptions: [],
}

function defaultRecord(): AvailabilitySettings {
  return { ...newBaseRecord(), id: SINGLETON_ID, ...DEFAULTS }
}

async function pushRemote(record: AvailabilitySettings) {
  if (!supabase) return
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  const { error } = await supabase
    .from('availability')
    .upsert(availabilityMapper.toRow(record, user.id), { onConflict: 'user_id' })
  if (error) console.error('[sync] no se pudo guardar la disponibilidad en Supabase:', error.message)
}

export const availabilityRepo = {
  /** Solo lectura: no escribe nada, seguro de usar dentro de useLiveQuery. */
  async get(): Promise<AvailabilitySettings> {
    return (await db.availability.get(SINGLETON_ID)) ?? defaultRecord()
  },

  /** Crea la fila por defecto si todavía no existe. Se llama una vez al iniciar la app. */
  async ensure(): Promise<AvailabilitySettings> {
    const existing = await db.availability.get(SINGLETON_ID)
    if (existing) return existing
    const record = defaultRecord()
    await db.availability.put(record)
    return record
  },

  async update(patch: Partial<AvailabilitySettings>): Promise<AvailabilitySettings> {
    const current = await availabilityRepo.ensure()
    const updated = touch({ ...current, ...patch })
    await db.availability.put(updated)
    queueChange('availability', SINGLETON_ID, 'upsert')
    await pushRemote(updated)
    return updated
  },

  async putLocal(record: AvailabilitySettings): Promise<void> {
    await db.availability.put({ ...record, id: SINGLETON_ID })
  },
}
