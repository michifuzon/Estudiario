import { db } from '../client'
import { createRepository } from './base'
import type { ChatMessage, ChatMessageStatus } from '../../../types/domain'

const base = createRepository<ChatMessage>(db.chatMessages, 'chatMessages')

export const chatRepo = {
  ...base,

  /** subjectId null = bandeja general */
  async listByScope(subjectId: string | null): Promise<ChatMessage[]> {
    const all = await base.list()
    return all
      .filter((m) => m.subjectId === subjectId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  },

  async listPinned(subjectId: string | null): Promise<ChatMessage[]> {
    const scoped = await chatRepo.listByScope(subjectId)
    return scoped.filter((m) => m.pinned)
  },

  async listPendingReview(): Promise<ChatMessage[]> {
    const all = await base.list()
    return all.filter((m) => m.status === 'pendiente_revisar' || m.status === 'nuevo')
  },

  async search(query: string, subjectId?: string | null): Promise<ChatMessage[]> {
    const all = await base.list()
    const q = query.trim().toLowerCase()
    if (!q) return []
    return all.filter((m) => {
      if (subjectId !== undefined && m.subjectId !== subjectId) return false
      return (
        m.text.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q)) ||
        m.unit.toLowerCase().includes(q)
      )
    })
  },

  async setStatus(id: string, status: ChatMessageStatus): Promise<ChatMessage> {
    return base.update(id, { status })
  },

  async togglePin(id: string): Promise<ChatMessage> {
    const message = await base.get(id)
    if (!message) throw new Error('Mensaje no encontrado')
    return base.update(id, { pinned: !message.pinned })
  },

  async moveToSubject(id: string, subjectId: string | null): Promise<ChatMessage> {
    return base.update(id, { subjectId })
  },

  async moveManyToSubject(ids: string[], subjectId: string | null): Promise<void> {
    await Promise.all(ids.map((id) => chatRepo.moveToSubject(id, subjectId)))
  },
}
