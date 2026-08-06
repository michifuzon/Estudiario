export function newId(): string {
  return crypto.randomUUID()
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function newBaseRecord() {
  const timestamp = nowIso()
  return {
    id: newId(),
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null as string | null,
  }
}

export function touch<T extends { updatedAt: string }>(record: T): T {
  return { ...record, updatedAt: nowIso() }
}
