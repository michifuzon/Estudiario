import { useLiveQuery } from 'dexie-react-hooks'
import { Sheet } from '@/components/ui/Sheet'
import { subjectsRepo, chatRepo } from '@/services/db/repositories'
import type { ChatMessage } from '@/types/domain'

export function MoveMessageSheet({
  message,
  onClose,
}: {
  message: ChatMessage | null
  onClose: () => void
}) {
  const subjects = useLiveQuery(() => subjectsRepo.listActive(), [])

  async function moveTo(subjectId: string | null) {
    if (!message) return
    await chatRepo.moveToSubject(message.id, subjectId)
    onClose()
  }

  return (
    <Sheet open={!!message} onClose={onClose} title="Mover a">
      <div className="flex flex-col gap-1">
        <button
          onClick={() => void moveTo(null)}
          className="rounded-xl px-3 py-2.5 text-left text-sm text-ink hover:bg-accent-soft"
        >
          Bandeja general
        </button>
        {subjects?.map((s) => (
          <button
            key={s.id}
            onClick={() => void moveTo(s.id)}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-ink hover:bg-accent-soft"
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
            {s.name}
          </button>
        ))}
      </div>
    </Sheet>
  )
}
