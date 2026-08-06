import { useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { format, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { Pin, Search } from 'lucide-react'
import clsx from 'clsx'
import { chatRepo } from '@/services/db/repositories'
import type { ChatMessage, ChatMessageType } from '@/types/domain'
import { ChatMessageBubble } from './ChatMessageBubble'
import { ChatComposer } from './ChatComposer'
import { MessageActionsSheet } from './MessageActionsSheet'
import { EmptyState } from '@/components/ui/EmptyState'

type Filter = 'todos' | 'pendientes' | 'importantes' | ChatMessageType

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendientes', label: 'Pendientes' },
  { value: 'importantes', label: 'Importantes' },
  { value: 'foto', label: 'Fotos' },
  { value: 'audio', label: 'Audios' },
  { value: 'archivo', label: 'Archivos' },
  { value: 'enlace', label: 'Enlaces' },
]

export function ChatView({ subjectId }: { subjectId: string | null }) {
  const [filter, setFilter] = useState<Filter>('todos')
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [activeMessage, setActiveMessage] = useState<ChatMessage | null>(null)

  const messages = useLiveQuery(() => chatRepo.listByScope(subjectId), [subjectId])
  const pinned = useMemo(() => (messages ?? []).filter((m) => m.pinned), [messages])

  const searchResults = useLiveQuery(
    () => (query.trim() ? chatRepo.search(query, subjectId) : Promise.resolve(null)),
    [query, subjectId],
  )

  const filtered = useMemo(() => {
    const base = query.trim() ? searchResults ?? [] : messages ?? []
    if (filter === 'todos') return base
    if (filter === 'pendientes') return base.filter((m) => m.status === 'pendiente_revisar' || m.status === 'nuevo')
    if (filter === 'importantes') return base.filter((m) => m.status === 'importante')
    return base.filter((m) => m.type === filter)
  }, [messages, searchResults, query, filter])

  // El chat vive en el flujo normal de la página (la scrollea `main`, como
  // cualquier otra pantalla) — la barra para escribir es "sticky" al fondo,
  // así queda siempre a mano sin tener que scrollear hasta abajo para
  // encontrarla. Este sentinel es lo que usamos para saltar al último
  // mensaje al abrir el chat o al enviar uno nuevo.
  const bottomRef = useRef<HTMLDivElement>(null)
  const messageCount = messages?.length ?? 0

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [subjectId])

  useEffect(() => {
    if (messageCount > 0) bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
  }, [messageCount])

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 px-1 pb-2">
        {searchOpen ? (
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onBlur={() => !query && setSearchOpen(false)}
            placeholder="Buscar en este chat…"
            className="flex-1 rounded-full border border-border bg-paper px-3.5 py-1.5 text-sm focus:border-accent focus:outline-none"
          />
        ) : (
          <>
            <div className="no-scrollbar flex flex-1 gap-1.5 overflow-x-auto">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={clsx(
                    'shrink-0 rounded-full px-3 py-1 text-xs font-medium',
                    filter === f.value ? 'bg-accent text-white' : 'bg-surface-raised text-muted',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button onClick={() => setSearchOpen(true)} className="shrink-0 rounded-full p-1.5 text-muted hover:bg-accent-soft">
              <Search size={17} />
            </button>
          </>
        )}
      </div>

      {!!pinned.length && !searchOpen && filter === 'todos' && (
        <div className="mb-2 flex flex-col gap-1 rounded-xl bg-accent-soft/60 px-3 py-2">
          {pinned.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveMessage(m)}
              className="flex items-center gap-2 text-left text-xs text-accent-ink"
            >
              <Pin size={11} className="shrink-0" />
              <span className="truncate">{m.text || 'Archivo adjunto'}</span>
            </button>
          ))}
        </div>
      )}

      <div className="min-h-[50vh] px-1 pb-3">
        {!filtered.length ? (
          <EmptyState
            title={query ? 'Sin resultados' : 'Todavía no hay nada acá'}
            description={query ? undefined : 'Escribí una nota o mandá una foto para empezar.'}
          />
        ) : (
          <MessageList messages={filtered} onOpenActions={setActiveMessage} />
        )}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-[var(--bottom-nav-h)] z-10 sm:bottom-0">
        <ChatComposer subjectId={subjectId} />
      </div>
      <MessageActionsSheet message={activeMessage} onClose={() => setActiveMessage(null)} />
    </div>
  )
}

function MessageList({
  messages,
  onOpenActions,
}: {
  messages: ChatMessage[]
  onOpenActions: (m: ChatMessage) => void
}) {
  let lastDate: Date | null = null
  return (
    <div className="flex flex-col gap-2 pb-2">
      {messages.map((message) => {
        const date = new Date(message.createdAt)
        const showSeparator = !lastDate || !isSameDay(lastDate, date)
        lastDate = date
        return (
          <div key={message.id}>
            {showSeparator && (
              <div className="my-3 text-center text-xs font-medium capitalize text-subtle">
                {format(date, "d 'de' MMMM", { locale: es })}
              </div>
            )}
            <ChatMessageBubble message={message} onOpenActions={onOpenActions} />
          </div>
        )
      })}
    </div>
  )
}
