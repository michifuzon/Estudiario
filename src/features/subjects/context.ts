import { useOutletContext } from 'react-router-dom'
import type { Subject } from '@/types/domain'

export function useSubjectContext(): { subject: Subject } {
  return useOutletContext<{ subject: Subject }>()
}
