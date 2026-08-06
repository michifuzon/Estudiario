import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { FileText, Link2, Mic, Pin } from 'lucide-react'
import { format } from 'date-fns'
import { attachmentsRepo } from '@/services/db/repositories'
import type { Attachment, ChatMessage, ChatMessageStatus } from '@/types/domain'
import { db } from '@/services/db/client'

const STATUS_LABEL: Record<ChatMessageStatus, string> = {
  nuevo: 'Nuevo',
  pendiente_revisar: 'Pendiente',
  revisado: 'Revisado',
  importante: 'Importante',
  usado_para_estudiar: 'Usado para estudiar',
  archivado: 'Archivado',
}

export function ChatMessageBubble({
  message,
  onOpenActions,
}: {
  message: ChatMessage
  onOpenActions: (message: ChatMessage) => void
}) {
  const attachment = useLiveQuery(
    () => db.attachments.where('chatMessageId').equals(message.id).first(),
    [message.id],
  )

  return (
    <button onClick={() => onOpenActions(message)} className="flex w-full flex-col items-end gap-1 text-left">
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm border border-border bg-surface px-3.5 py-2.5">
        {message.pinned && (
          <div className="mb-1 flex items-center gap-1 text-xs text-accent">
            <Pin size={11} /> Fijado
          </div>
        )}

        {attachment && <AttachmentPreview attachment={attachment} />}

        {message.text && <p className="whitespace-pre-wrap text-sm text-ink">{message.text}</p>}

        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-subtle">
          <span>{format(new Date(message.createdAt), 'HH:mm')}</span>
          {message.status !== 'nuevo' && <span>· {STATUS_LABEL[message.status]}</span>}
        </div>
      </div>
    </button>
  )
}

function AttachmentPreview({ attachment }: { attachment: Attachment }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let objectUrl: string | null = null
    attachmentsRepo.getBlobUrl(attachment).then((u) => {
      objectUrl = u
      setUrl(u)
    })
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [attachment])

  if (attachment.category === 'foto_pizarron' || attachment.mimeType.startsWith('image/')) {
    return url ? (
      <img src={url} alt={attachment.title} className="mb-2 max-h-52 w-full rounded-xl object-cover" />
    ) : (
      <div className="mb-2 h-32 w-full animate-pulse rounded-xl bg-paper" />
    )
  }

  if (attachment.mimeType.startsWith('audio/')) {
    return url ? (
      <div className="mb-2 flex items-center gap-2 rounded-xl bg-paper px-3 py-2">
        <Mic size={16} className="shrink-0 text-accent" />
        <audio controls src={url} className="h-8 w-full max-w-56" />
      </div>
    ) : null
  }

  if (attachment.category === 'enlace') {
    return (
      <a
        href={attachment.url ?? '#'}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="mb-2 flex items-center gap-2 rounded-xl bg-paper px-3 py-2 text-sm text-accent-ink underline"
      >
        <Link2 size={16} className="shrink-0" />
        <span className="truncate">{attachment.title}</span>
      </a>
    )
  }

  return (
    <div className="mb-2 flex items-center gap-2 rounded-xl bg-paper px-3 py-2 text-sm text-ink">
      <FileText size={16} className="shrink-0 text-accent" />
      <span className="truncate">{attachment.title}</span>
    </div>
  )
}
