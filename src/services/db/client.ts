import Dexie, { type Table } from 'dexie'
import type {
  AIProviderSettings,
  Attachment,
  AvailabilitySettings,
  ChatMessage,
  EventItem,
  Grade,
  Semester,
  StudyProfile,
  StudySession,
  Subject,
} from '../../types/domain'

export interface SyncOutboxEntry {
  seq?: number
  entity: string
  recordId: string
  op: 'upsert' | 'delete'
  queuedAt: string
}

/**
 * Almacenamiento local (IndexedDB vía Dexie). Es la fuente de datos que usa
 * toda la app hoy. Cuando se configuren credenciales de Supabase
 * (ver services/supabase/client.ts), el servicio de sync (services/sync)
 * empuja/trae cambios contra la nube usando estas mismas tablas como cache
 * y cola offline — la UI nunca habla con Supabase directamente.
 */
export class EstudiarioDB extends Dexie {
  semesters!: Table<Semester, string>
  subjects!: Table<Subject, string>
  events!: Table<EventItem, string>
  studySessions!: Table<StudySession, string>
  grades!: Table<Grade, string>
  availability!: Table<AvailabilitySettings, string>
  chatMessages!: Table<ChatMessage, string>
  attachments!: Table<Attachment, string>
  attachmentBlobs!: Table<{ id: string; blob: Blob }, string>
  aiProviderSettings!: Table<AIProviderSettings, string>
  studyProfile!: Table<StudyProfile, string>
  syncOutbox!: Table<SyncOutboxEntry, string>

  constructor() {
    super('estudiario')
    this.version(1).stores({
      semesters: 'id, isArchived, deletedAt',
      subjects: 'id, semesterId, status, deletedAt',
      events: 'id, subjectId, date, type, status, deletedAt',
      studySessions: 'id, subjectId, eventId, date, status, deletedAt',
      grades: 'id, subjectId, date, deletedAt',
      availability: 'id',
      chatMessages: 'id, subjectId, status, pinned, createdAt, deletedAt',
      attachments: 'id, chatMessageId, subjectId, category, deletedAt',
      attachmentBlobs: 'id',
      aiProviderSettings: 'id',
      studyProfile: 'id',
      syncOutbox: '++seq, entity, recordId, queuedAt',
    })
  }
}

export const db = new EstudiarioDB()
