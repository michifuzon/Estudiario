import { CalendarDays, Home, LayoutList, NotebookText, Settings, Sparkles } from 'lucide-react'
import type { ComponentType } from 'react'

export interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ size?: number; className?: string }>
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/calendario', label: 'Calendario', icon: CalendarDays },
  { to: '/materias', label: 'Materias', icon: NotebookText },
  { to: '/plan', label: 'Plan', icon: LayoutList },
  { to: '/asistente', label: 'Asistente', icon: Sparkles },
  { to: '/configuracion', label: 'Ajustes', icon: Settings },
]
