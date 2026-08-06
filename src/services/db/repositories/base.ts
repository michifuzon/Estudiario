import type { Table } from 'dexie'
import type { BaseRecord } from '../../../types/domain'
import { newBaseRecord, touch } from '../../../lib/record'
import { queueChange } from '../../sync/outbox'

/**
 * CRUD genérico sobre una tabla Dexie para entidades que extienden BaseRecord.
 * Cada repositorio de entidad (subjects.ts, events.ts, etc.) usa esto como base
 * y agrega sus propias consultas específicas encima.
 */
export function createRepository<T extends BaseRecord>(
  table: Table<T, string>,
  entity: string,
) {
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
      return record
    },

    async update(id: string, patch: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<T> {
      const existing = await table.get(id)
      if (!existing) throw new Error(`${entity} ${id} no encontrado`)
      const updated = touch({ ...existing, ...patch }) as T
      await table.put(updated)
      queueChange(entity, id, 'upsert')
      return updated
    },

    async remove(id: string): Promise<void> {
      const existing = await table.get(id)
      if (!existing) return
      await table.put(touch({ ...existing, deletedAt: new Date().toISOString() }))
      queueChange(entity, id, 'delete')
    },

    async hardRemove(id: string): Promise<void> {
      await table.delete(id)
    },
  }
}
