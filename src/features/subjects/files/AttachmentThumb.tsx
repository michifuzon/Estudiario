import { useEffect, useState } from 'react'
import { FileText, Link2, Mic } from 'lucide-react'
import { attachmentsRepo } from '@/services/db/repositories'
import type { Attachment } from '@/types/domain'

export function AttachmentThumb({ attachment }: { attachment: Attachment }) {
  const [url, setUrl] = useState<string | null>(null)
  const isImage = attachment.mimeType.startsWith('image/')

  useEffect(() => {
    let objectUrl: string | null = null
    attachmentsRepo.getBlobUrl(attachment).then((u) => {
      objectUrl = u
      setUrl(u)
    })
    return () => {
      if (objectUrl && isImage) URL.revokeObjectURL(objectUrl)
    }
  }, [attachment, isImage])

  return (
    <a
      href={url ?? undefined}
      target="_blank"
      rel="noreferrer"
      className="flex aspect-square flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border border-border bg-surface p-2 text-center"
    >
      {isImage && url ? (
        <img src={url} alt={attachment.title} className="h-full w-full rounded-lg object-cover" />
      ) : (
        <>
          <span className="text-muted">
            {attachment.mimeType.startsWith('audio/') ? (
              <Mic size={20} />
            ) : attachment.category === 'enlace' ? (
              <Link2 size={20} />
            ) : (
              <FileText size={20} />
            )}
          </span>
          <span className="line-clamp-2 text-[11px] text-muted">{attachment.title}</span>
        </>
      )}
    </a>
  )
}
