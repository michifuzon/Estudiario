import { db } from './client'

const DATA_TABLES = [
  'semesters',
  'subjects',
  'events',
  'studySessions',
  'grades',
  'availability',
  'chatMessages',
  'attachments',
  'aiProviderSettings',
  'studyProfile',
] as const

export async function exportAllData(): Promise<Blob> {
  const payload: Record<string, unknown> = { exportedAt: new Date().toISOString() }
  for (const table of DATA_TABLES) {
    payload[table] = await db.table(table).toArray()
  }
  return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
}

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((table) => table.clear()))
  })
}
