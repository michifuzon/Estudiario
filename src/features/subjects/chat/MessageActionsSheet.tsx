import { useState } from 'react'
import {
  Archive,
  CalendarPlus,
  CheckCircle,
  FolderInput,
  ListChecks,
  Pin,
  PinOff,
  Star,
  Trash2,
} from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { chatRepo } from '@/services/db/repositories'
import type { ChatMessage } from '@/types/domain'
import { MoveMessageSheet } from './MoveMessageSheet'
import { ConvertMessageSheet } from './ConvertMessageSheet'

export function MessageActionsSheet({
  message,
  onClose,
}: {
  message: ChatMessage | null
  onClose: () => void
}) {
  const [moving, setMoving] = useState(false)
  const [converting, setConverting] = useState<'evento' | 'sesion' | null>(null)

  if (!message) return null

  const actions = [
    {
      icon: message.pinned ? PinOff : Pin,
      label: message.pinned ? 'Quitar de fijados' : 'Fijar',
      onClick: async () => { await chatRepo.togglePin(message.id); onClose() },
    },
    {
      icon: Star,
      label: 'Marcar como importante',
      onClick: async () => { await chatRepo.setStatus(message.id, 'importante'); onClose() },
    },
    {
      icon: CheckCircle,
      label: 'Marcar como revisado',
      onClick: async () => { await chatRepo.setStatus(message.id, 'revisado'); onClose() },
    },
    {
      icon: FolderInput,
      label: 'Mover a otra materia',
      onClick: async () => setMoving(true),
    },
    {
      icon: CalendarPlus,
      label: 'Convertir a evento',
      onClick: async () => setConverting('evento'),
    },
    {
      icon: ListChecks,
      label: 'Convertir a sesión de estudio',
      onClick: async () => setConverting('sesion'),
    },
    {
      icon: Archive,
      label: 'Archivar',
      onClick: async () => { await chatRepo.setStatus(message.id, 'archivado'); onClose() },
    },
    {
      icon: Trash2,
      label: 'Eliminar',
      danger: true,
      onClick: async () => { await chatRepo.remove(message.id); onClose() },
    },
  ]

  return (
    <>
      <Sheet open={!!message && !moving && !converting} onClose={onClose} title="Opciones del mensaje">
        <div className="flex flex-col gap-1">
          {actions.map(({ icon: Icon, label, onClick, danger }) => (
            <button
              key={label}
              onClick={() => void onClick()}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-accent-soft ${
                danger ? 'text-danger' : 'text-ink'
              }`}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </div>
      </Sheet>

      <MoveMessageSheet message={moving ? message : null} onClose={() => { setMoving(false); onClose() }} />
      <ConvertMessageSheet
        message={converting ? message : null}
        kind={converting}
        onClose={() => { setConverting(null); onClose() }}
      />
    </>
  )
}
