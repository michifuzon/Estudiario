import { differenceInCalendarDays, format } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0 min'
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes} min`
  if (minutes === 0) return `${hours} h`
  return `${hours} h ${minutes} min`
}

export function formatDateLong(isoDate: string): string {
  return format(new Date(`${isoDate}T00:00:00`), "d 'de' MMMM", { locale: es })
}

export function formatDateShort(isoDate: string): string {
  return format(new Date(`${isoDate}T00:00:00`), 'd MMM', { locale: es })
}

export function formatWeekday(isoDate: string): string {
  return format(new Date(`${isoDate}T00:00:00`), 'EEEE', { locale: es })
}

export function daysUntil(isoDate: string): number {
  return differenceInCalendarDays(new Date(`${isoDate}T00:00:00`), new Date(new Date().toDateString()))
}

export function formatDaysUntil(isoDate: string): string {
  const days = daysUntil(isoDate)
  if (days < 0) return 'Ya pasó'
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Mañana'
  return `Faltan ${days} días`
}
