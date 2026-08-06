import { isSupabaseConfigured } from '../supabase/client'
import { pendingChangeCount } from './outbox'

export type SyncMode = 'local' | 'conectado'

export interface SyncStatus {
  mode: SyncMode
  online: boolean
  pendingChanges: number
}

/**
 * Estado de sincronización para mostrar en Configuración.
 *
 * `mode: 'local'` — no hay proyecto de Supabase conectado todavía. Todo se
 * guarda solo en este dispositivo (IndexedDB). Los cambios se siguen
 * encolando en syncOutbox para no perder nada cuando se conecte Supabase.
 *
 * `mode: 'conectado'` — hay credenciales cargadas. El push/pull real contra
 * Postgres se implementa en la Etapa 1.5 (drenar syncOutbox + suscripción
 * realtime); acá se deja el punto de entrada ya cableado para no tener que
 * rediseñar la capa de datos cuando se agregue.
 */
export async function getSyncStatus(): Promise<SyncStatus> {
  return {
    mode: isSupabaseConfigured ? 'conectado' : 'local',
    online: typeof navigator === 'undefined' ? true : navigator.onLine,
    pendingChanges: await pendingChangeCount(),
  }
}
