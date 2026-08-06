import type { Difficulty, EventType, SubjectStatus } from '@/types/domain'

export function difficultyColorVar(level: Difficulty): string {
  return {
    1: 'var(--difficulty-easy)',
    2: 'var(--difficulty-medium)',
    3: 'var(--difficulty-hard)',
    4: 'var(--difficulty-extreme)',
  }[level]
}

export function eventTypeColorVar(type: EventType): string {
  switch (type) {
    case 'parcial':
    case 'recuperatorio':
      return 'var(--event-exam)'
    case 'final':
      return 'var(--event-final)'
    case 'entrega':
    case 'trabajo_practico':
    case 'presentacion':
      return 'var(--event-delivery)'
    case 'clase':
    case 'inscripcion':
    case 'sin_clases':
      return 'var(--event-class)'
    case 'sesion_estudio':
    case 'recordatorio':
    default:
      return 'var(--event-reminder)'
  }
}

export const SUBJECT_STATUS_LABEL: Record<SubjectStatus, string> = {
  cursando: 'Cursando',
  pendiente: 'Pendiente',
  regularizada: 'Regularizada',
  aprobada: 'Aprobada',
  archivada: 'Archivada',
}
