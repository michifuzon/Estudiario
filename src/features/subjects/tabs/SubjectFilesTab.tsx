import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { FileText } from 'lucide-react'
import { useSubjectContext } from '../context'
import { attachmentsRepo } from '@/services/db/repositories'
import { ATTACHMENT_CATEGORY_LABEL, type Attachment, type AttachmentCategory } from '@/types/domain'
import { EmptyState } from '@/components/ui/EmptyState'
import { AttachmentThumb } from '../files/AttachmentThumb'

const CATEGORY_ORDER = Object.keys(ATTACHMENT_CATEGORY_LABEL) as AttachmentCategory[]

export function SubjectFilesTab() {
  const { subject } = useSubjectContext()
  const attachments = useLiveQuery(() => attachmentsRepo.listBySubject(subject.id), [subject.id])

  const grouped = useMemo(() => {
    const map = new Map<AttachmentCategory, Attachment[]>()
    for (const a of attachments ?? []) {
      if (!map.has(a.category)) map.set(a.category, [])
      map.get(a.category)!.push(a)
    }
    return map
  }, [attachments])

  if (!attachments?.length) {
    return (
      <EmptyState
        icon={<FileText size={26} />}
        title="Todavía no hay archivos"
        description="Lo que envíes por el chat de esta materia va a aparecer acá, organizado por categoría."
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {CATEGORY_ORDER.filter((c) => grouped.has(c)).map((category) => (
        <div key={category}>
          <h3 className="mb-2 text-sm font-medium text-ink">{ATTACHMENT_CATEGORY_LABEL[category]}</h3>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {grouped.get(category)!.map((a) => (
              <AttachmentThumb key={a.id} attachment={a} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
