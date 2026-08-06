import { useSubjectContext } from '../context'
import { ChatView } from '../chat/ChatView'

export function SubjectChatTab() {
  const { subject } = useSubjectContext()
  return <ChatView subjectId={subject.id} />
}
