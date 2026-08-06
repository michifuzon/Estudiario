import type { Table } from 'dexie'
import type { BaseRecord } from '../../../types/domain'
import { newBaseRecord, touch } from '../../../lib/record'
import { queueChange } from '../../sync/outbox'
import { supabase } from '../../supabase/client'

export interface RemoteSync<T> {
  tableName: string
  toRow: (record: T, userId: string) => Record<string, unknown>
}

/**
 * CRUD genérico sobre una tabla Dexie para entidades que extienden BaseRecord.
 * Cada repositorio de entidad (subjects.ts, events.ts, etc.) usa esto como base
 * y agrega sus propias consultas específicas encima.
 *
 * Si se pasa `remote`, cada escritura local se espeja contra la tabla de
 * Supabase correspondiente (cuando hay sesión iniciada). Se espera a que
 * termine (no es fire-and-forget): así, si una materia depende de un
 * semestre creado un instante antes, el semestre ya está guardado en el
 * servidor cuando se intenta guardar la materia — evita errores de clave
 * foránea por orden de llegada. Dexie sigue siendo lo que lee la UI, así
 * que la espera no la nota el usuario salvo por la latencia de red real.
 */
export function createRepository<T extends BaseRecord>(
  table: Table<T, string>,
  entity: string,
  remote?: RemoteSync<T>,
) {
  async function pushRemote(record: T) {
    if (!remote || !supabase) return
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from(remote.tableName).upsert(remote.toRow(record, user.id))
    if (error) {
      // El dato ya está a salvo en Dexie. Lo dejamos en consola para poder
      // diagnosticar (RLS, FK, columna faltante, etc.) sin romper la UI.
      console.error(`[sync] no se pudo guardar "${entity}" (${record.id}) en Supabase:`, error.message)
    }
  }

  return {
    async list(): Promise<T[]> {
      const rows = await table.toArray()
      return rows.filter((r) => !r.deletedAt)
    },

    async get(id: string): Promise<T | undefined> {
      const row = await table.get(id)
      return row && !row.deletedAt ? row : undefined
    },

    async create(data: Omit<T, keyof BaseRecord>): Promise<T> {
      const record = { ...newBaseRecord(), ...data } as unknown as T
      await table.put(record)
      queueChange(entity, record.id, 'upsert')
      await pushRemote(record)
      return record
    },

    async update(id: string, patch: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<T> {
      const existing = await table.get(id)
      if (!existing) throw new Error(`${entity} ${id} no encontrado`)
      const updated = touch({ ...existing, ...patch }) as T
      await table.put(updated)
      queueChange(entity, id, 'upsert')
      await pushRemote(updated)
      return updated
    },

    async remove(id: string): Promise<void> {
      const existing = await table.get(id)
      if (!existing) return
      const removed = touch({ ...existing, deletedAt: new Date().toISOString() }) as T
      await table.put(removed)
      queueChange(entity, id, 'delete')
      await pushRemote(removed)
    },

    async hardRemove(id: string): Promise<void> {
      await table.delete(id)
    },

    /** Inserta/actualiza en Dexie sin volver a empujar a Supabase — lo usa el motor de sync al traer datos remotos. */
    async putLocal(record: T): Promise<void> {
      await table.put(record)
    },
  }
}
