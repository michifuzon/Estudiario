import { chatRepo, attachmentsRepo, eventsRepo, sessionsRepo } from '@/services/db/repositories'
import type { AttachmentCategory, ChatMessageType, EventType } from '@/types/domain'

function defaultCategoryFor(type: ChatMessageType): AttachmentCategory {
  if (type === 'foto') return 'foto_pizarron'
  if (type === 'enlace') return 'enlace'
  return 'archivo'
}

/** Envía un mensaje de texto simple al chat de una materia (o a la bandeja general si subjectId es null). */
export async function sendTextMessage(subjectId: string | null, text: string) {
  return chatRepo.create({
    subjectId,
    type: 'texto',
    text,
    status: 'nuevo',
    pinned: false,
    tags: [],
    replyToId: null,
    linkedEventId: null,
    linkedSessionId: null,
    unit: '',
  })
}

/** Envía un archivo (foto, PDF, documento, audio) y lo deja pendiente de revisar. */
export async function sendFileMessage(params: {
  subjectId: string | null
  type: Extract<ChatMessageType, 'foto' | 'audio' | 'archivo'>
  file: File
  caption?: string
}) {
  const message = await chatRepo.create({
    subjectId: params.subjectId,
    type: params.type,
    text: params.caption ?? '',
    status: 'pendiente_revisar',
    pinned: false,
    tags: [],
    replyToId: null,
    linkedEventId: null,
    linkedSessionId: null,
    unit: '',
  })
  const attachment = await attachmentsRepo.createFromFile({
    file: params.file,
    subjectId: params.subjectId,
    chatMessageId: message.id,
    category: defaultCategoryFor(params.type),
  })
  return { message, attachment }
}

export async function sendLinkMessage(params: { subjectId: string | null; url: string; title: string }) {
  const message = await chatRepo.create({
    subjectId: params.subjectId,
    type: 'enlace',
    text: params.title,
    status: 'nuevo',
    pinned: false,
    tags: [],
    replyToId: null,
    linkedEventId: null,
    linkedSessionId: null,
    unit: '',
  })
  const attachment = await attachmentsRepo.createLink({
    url: params.url,
    title: params.title,
    subjectId: params.subjectId,
    chatMessageId: message.id,
  })
  return { message, attachment }
}

/** Convierte un mensaje del chat en un evento del calendario (parcial, entrega, etc.). */
export async function convertMessageToEvent(params: {
  messageId: string
  subjectId: string | null
  type: EventType
  title: string
  date: string
}) {
  const event = await eventsRepo.create({
    subjectId: params.subjectId,
    type: params.type,
    title: params.title,
    date: params.date,
    time: null,
    topics: '',
    importance: 2,
    notes: '',
    status: 'pendiente',
  })
  await chatRepo.update(params.messageId, { linkedEventId: event.id, status: 'revisado' })
  return event
}

/** Convierte un mensaje del chat en una sesión de estudio, con el material vinculado. */
export async function convertMessageToSession(params: {
  messageId: string
  subjectId: string
  topic: string
  date: string
  durationMinutes: number
}) {
  const session = await sessionsRepo.create({
    subjectId: params.subjectId,
    eventId: null,
    chatMessageId: params.messageId,
    topic: params.topic,
    objective: '',
    date: params.date,
    durationMinutes: params.durationMinutes,
    priority: 0,
    status: 'pendiente',
    origin: 'manual',
    reasoning: 'Creada manualmente desde un mensaje del chat.',
    actualMinutes: null,
    focusRating: null,
    perceivedDifficulty: null,
    notes: '',
  })
  await chatRepo.update(params.messageId, { linkedSessionId: session.id, status: 'usado_para_estudiar' })
  return session
}
