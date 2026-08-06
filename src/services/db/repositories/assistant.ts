import { db } from '../client'
import { newId, nowIso } from '../../../lib/record'
import type { AssistantMessage } from '../../../types/domain'

export const assistantMessagesRepo = {
  async list(): Promise<AssistantMessage[]> {
    const rows = await db.assistantMessages.toArray()
    return rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  },

  async add(role: AssistantMessage['role'], text: string, proposal: unknown | null = null): Promise<AssistantMessage> {
    const record: AssistantMessage = { id: newId(), role, text, proposal, createdAt: nowIso() }
    await db.assistantMessages.put(record)
    return record
  },

  async clear(): Promise<void> {
    await db.assistantMessages.clear()
  },
}
