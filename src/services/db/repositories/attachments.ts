import { db } from '../client'
import { createRepository } from './base'
import { newId } from '../../../lib/record'
import type { Attachment, AttachmentCategory } from '../../../types/domain'

const base = createRepository<Attachment>(db.attachments, 'attachments')

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024 // 25MB

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf',
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export class InvalidFileError extends Error {}

export function validateFile(file: File): void {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new InvalidFileError(
      `El archivo supera el tamaño máximo permitido (${Math.round(MAX_FILE_SIZE_BYTES / 1024 / 1024)}MB).`,
    )
  }
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new InvalidFileError(`Tipo de archivo no admitido: ${file.type || 'desconocido'}.`)
  }
}

export const attachmentsRepo = {
  ...base,

  async listBySubject(subjectId: string): Promise<Attachment[]> {
    const all = await base.list()
    return all.filter((a) => a.subjectId === subjectId)
  },

  async listByCategory(subjectId: string, category: AttachmentCategory): Promise<Attachment[]> {
    const bySubject = await attachmentsRepo.listBySubject(subjectId)
    return bySubject.filter((a) => a.category === category)
  },

  /** Guarda el archivo (blob local) y crea el registro de attachment asociado. */
  async createFromFile(params: {
    file: File
    subjectId: string | null
    chatMessageId: string | null
    category: AttachmentCategory
    title?: string
  }): Promise<Attachment> {
    validateFile(params.file)
    const blobId = newId()
    await db.attachmentBlobs.put({ id: blobId, blob: params.file })
    return base.create({
      chatMessageId: params.chatMessageId,
      subjectId: params.subjectId,
      category: params.category,
      title: params.title ?? params.file.name,
      mimeType: params.file.type,
      sizeBytes: params.file.size,
      storageRef: blobId,
      extractedText: null,
      url: null,
    })
  },

  async createLink(params: {
    url: string
    title: string
    subjectId: string | null
    chatMessageId: string | null
  }): Promise<Attachment> {
    return base.create({
      chatMessageId: params.chatMessageId,
      subjectId: params.subjectId,
      category: 'enlace',
      title: params.title,
      mimeType: 'text/uri-list',
      sizeBytes: 0,
      storageRef: '',
      extractedText: null,
      url: params.url,
    })
  },

  async getBlobUrl(attachment: Attachment): Promise<string | null> {
    if (!attachment.storageRef) return attachment.url
    const row = await db.attachmentBlobs.get(attachment.storageRef)
    if (!row) return null
    return URL.createObjectURL(row.blob)
  },
}
