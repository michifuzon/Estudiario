// Modelo de dominio de Estudiario.
// Estas mismas formas se reflejan en supabase/migrations/0001_init.sql —
// si se agrega un campo acá, agregarlo también en la migración y en el
// mapper de src/services/db/schema.ts.

export type ID = string

export interface BaseRecord {
  id: ID
  createdAt: string
  updatedAt: string
  /** soft delete: si tiene fecha, el registro se excluye de las vistas pero se conserva para sync */
  deletedAt: string | null
}

export type SubjectStatus =
  | 'cursando'
  | 'pendiente'
  | 'regularizada'
  | 'aprobada'
  | 'archivada'

/** 1 = fácil, 2 = media, 3 = difícil, 4 = muy difícil */
export type Difficulty = 1 | 2 | 3 | 4

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  1: 'Fácil',
  2: 'Media',
  3: 'Difícil',
  4: 'Muy difícil',
}

/** Peso base usado por el planificador (services/planner/engine.ts) */
export const DIFFICULTY_WEIGHT: Record<Difficulty, number> = {
  1: 1,
  2: 1.5,
  3: 2,
  4: 3,
}

export interface Semester extends BaseRecord {
  name: string
  startDate: string | null
  endDate: string | null
  isArchived: boolean
}

export interface Subject extends BaseRecord {
  semesterId: ID
  name: string
  professors: string[]
  schedule: string
  location: string
  color: string
  description: string
  difficulty: Difficulty
  weeklyHoursTarget: number
  status: SubjectStatus
}

export type EventType =
  | 'parcial'
  | 'final'
  | 'recuperatorio'
  | 'entrega'
  | 'trabajo_practico'
  | 'presentacion'
  | 'clase'
  | 'inscripcion'
  | 'sin_clases'
  | 'sesion_estudio'
  | 'recordatorio'

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  parcial: 'Parcial',
  final: 'Final',
  recuperatorio: 'Recuperatorio',
  entrega: 'Entrega',
  trabajo_practico: 'Trabajo práctico',
  presentacion: 'Presentación',
  clase: 'Clase importante',
  inscripcion: 'Inscripción',
  sin_clases: 'Día sin clases',
  sesion_estudio: 'Sesión de estudio',
  recordatorio: 'Recordatorio',
}

export type ImportanceLevel = 1 | 2 | 3

export interface EventItem extends BaseRecord {
  subjectId: ID | null
  type: EventType
  title: string
  date: string // YYYY-MM-DD
  time: string | null // HH:mm
  topics: string
  importance: ImportanceLevel
  notes: string
  status: 'pendiente' | 'completado' | 'cancelado'
}

export type SessionStatus = 'pendiente' | 'en_curso' | 'completada' | 'pospuesta'

export interface StudySession extends BaseRecord {
  subjectId: ID
  eventId: ID | null
  chatMessageId: ID | null
  topic: string
  objective: string
  date: string // YYYY-MM-DD
  durationMinutes: number
  priority: number
  status: SessionStatus
  origin: 'auto' | 'manual'
  reasoning: string
  actualMinutes: number | null
  focusRating: number | null
  perceivedDifficulty: number | null
  notes: string
}

export type GradeStatus = 'aprobado' | 'desaprobado' | 'pendiente'

export interface Grade extends BaseRecord {
  subjectId: ID
  name: string
  score: number | null
  maxScore: number
  weight: number
  date: string
  observations: string
  status: GradeStatus
}

export interface WeeklyAvailabilitySlot {
  id: ID
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0 = domingo
  startTime: string // HH:mm
  endTime: string // HH:mm
}

export interface AvailabilityException {
  id: ID
  date: string
  type: 'no_disponible' | 'mas_disponible'
  note: string
}

/** Con cuántos días de anticipación empezar a estudiar cada materia, según su dificultad. */
export type AnticipationByDifficulty = Record<Difficulty, number>

export const DEFAULT_ANTICIPATION_DAYS: AnticipationByDifficulty = {
  1: 5,
  2: 10,
  3: 15,
  4: 21,
}

export interface AvailabilitySettings extends BaseRecord {
  maxDailyMinutes: number
  preferredSessionMinutes: number
  breakMinutes: number
  timeOfDayPreference: 'mañana' | 'tarde' | 'noche' | 'indistinto'
  anticipationDaysByDifficulty: AnticipationByDifficulty
  weeklySlots: WeeklyAvailabilitySlot[]
  exceptions: AvailabilityException[]
}

export type ChatScope = { subjectId: ID } | { subjectId: null } // null = bandeja general

export type ChatMessageType = 'texto' | 'foto' | 'audio' | 'archivo' | 'enlace'

export type ChatMessageStatus =
  | 'nuevo'
  | 'pendiente_revisar'
  | 'revisado'
  | 'importante'
  | 'usado_para_estudiar'
  | 'archivado'

export interface ChatMessage extends BaseRecord {
  subjectId: ID | null // null = bandeja general
  type: ChatMessageType
  text: string
  status: ChatMessageStatus
  pinned: boolean
  tags: string[]
  replyToId: ID | null
  linkedEventId: ID | null
  linkedSessionId: ID | null
  unit: string
}

export type AttachmentCategory =
  | 'resumen'
  | 'apunte'
  | 'guia_practica'
  | 'trabajo_practico'
  | 'parcial_anterior'
  | 'material_teorico'
  | 'foto_pizarron'
  | 'archivo'
  | 'enlace'
  | 'nota_rapida'

export const ATTACHMENT_CATEGORY_LABEL: Record<AttachmentCategory, string> = {
  resumen: 'Resúmenes',
  apunte: 'Apuntes',
  guia_practica: 'Guías prácticas',
  trabajo_practico: 'Trabajos prácticos',
  parcial_anterior: 'Parciales anteriores',
  material_teorico: 'Material teórico',
  foto_pizarron: 'Fotografías del pizarrón',
  archivo: 'Archivos',
  enlace: 'Enlaces',
  nota_rapida: 'Notas rápidas',
}

export interface Attachment extends BaseRecord {
  chatMessageId: ID | null
  subjectId: ID | null
  category: AttachmentCategory
  title: string
  mimeType: string
  sizeBytes: number
  /** blob guardado en Dexie (services/db) o URL firmada de Supabase Storage */
  storageRef: string
  extractedText: string | null
  url: string | null // para categoría "enlace"
}

export type AIProviderKind = 'ninguno' | 'anthropic' | 'openai' | 'google' | 'local'

export interface AIProviderSettings extends BaseRecord {
  provider: AIProviderKind
  hasKeyConfigured: boolean
  model: string
}

export interface StudyProfile extends BaseRecord {
  onboardingCompleted: boolean
  preferredSessionMinutes: number
  anticipationDays: number
  studyMethod: string
}

export interface AssistantMessage {
  id: ID
  role: 'user' | 'assistant'
  text: string
  /** si este turno vino con una propuesta de evento (foto o texto), se guarda para poder re-renderizarla */
  proposal: unknown | null
  createdAt: string
}
