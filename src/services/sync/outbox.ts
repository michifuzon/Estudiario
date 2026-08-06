import { db } from '../db/client'

/**
 * Encola un cambio local para sincronizar contra Supabase más adelante.
 * Mientras no haya credenciales de Supabase configuradas (ver
 * services/supabase/client.ts), esto solo acumula entradas: no tiene ningún
 * efecto visible y la app funciona 100% local. Cuando se configura Supabase,
 * services/sync/engine.ts drena esta cola.
 */
export function queueChange(entity: string, recordId: string, op: 'upsert' | 'delete'): void {
  void db.syncOutbox.add({
    entity,
    recordId,
    op,
    queuedAt: new Date().toISOString(),
  })
}

export async function pendingChangeCount(): Promise<number> {
  return db.syncOutbox.count()
}

export async function clearOutbox(): Promise<void> {
  await db.syncOutbox.clear()
}
