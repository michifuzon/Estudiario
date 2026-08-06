import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { ChatView } from './chat/ChatView'

export function InboxScreen() {
  const navigate = useNavigate()
  return (
    <div className="mx-auto max-w-3xl px-4 py-4">
      <div className="mb-2 flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="rounded-full p-1.5 text-muted hover:bg-accent-soft">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl">Bandeja general</h1>
          <p className="text-sm text-muted">Guardá algo rápido y después decidí en qué materia va.</p>
        </div>
      </div>
      <ChatView subjectId={null} />
    </div>
  )
}
