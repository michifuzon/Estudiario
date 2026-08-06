import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { Send, Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { aiSettingsRepo } from '@/services/db/repositories'
import { answerLocally } from '@/services/assistant/ruleBasedAssistant'

interface Turn {
  role: 'user' | 'assistant'
  text: string
}

const SUGGESTIONS = [
  '¿Qué tengo que estudiar hoy?',
  '¿Cuánto falta para el parcial?',
  '¿Qué materia debería priorizar?',
  '¿Qué temas me quedan pendientes?',
]

export function AssistantScreen() {
  const aiSettings = useLiveQuery(() => aiSettingsRepo.get(), [])
  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState('')

  async function handleSend(text?: string) {
    const value = (text ?? input).trim()
    if (!value) return
    setInput('')
    setTurns((prev) => [...prev, { role: 'user', text: value }])
    const local = await answerLocally(value)
    setTurns((prev) => [
      ...prev,
      {
        role: 'assistant',
        text:
          local ??
          'Todavía no tengo una respuesta preparada para eso sin conectar un proveedor de IA. Podés preguntarme qué estudiar hoy, cuánto falta para un parcial, qué materia priorizar o qué temas te quedan pendientes.',
      },
    ])
  }

  const hasProvider = aiSettings && aiSettings.provider !== 'ninguno'

  return (
    <div className="mx-auto flex h-[calc(100svh-4rem)] max-w-2xl flex-col px-4 py-6 sm:h-[calc(100svh-2rem)]">
      <PageHeader icon={<Sparkles size={20} />} title="Asistente" subtitle="Preguntá sobre tus materias, fechas y plan de estudio." />

      {!hasProvider && (
        <div className="mt-4 rounded-xl border border-border bg-surface-raised px-4 py-3 text-sm text-muted">
          Estás en modo sin IA paga: respondo lo que puedo calcular con tus propios datos. Para resúmenes,
          flashcards y respuestas más flexibles, cargá tu propia clave en{' '}
          <Link to="/configuracion" className="text-accent underline">
            Configuración
          </Link>
          .
        </div>
      )}

      <div className="mt-4 flex-1 overflow-y-auto">
        {!turns.length ? (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => void handleSend(s)}
                className="rounded-full border border-border px-3 py-1.5 text-sm text-muted hover:bg-accent-soft"
              >
                {s}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {turns.map((turn, i) => (
              <div key={i} className={turn.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={
                    turn.role === 'user'
                      ? 'max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-accent px-3.5 py-2.5 text-sm text-white'
                      : 'max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tl-sm border border-border bg-surface px-3.5 py-2.5 text-sm text-ink'
                  }
                >
                  {turn.text}
                </div>
              </div>
            ))}
            {!hasProvider && <Badge tone="neutral">Respuestas locales, sin IA</Badge>}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void handleSend()}
          placeholder="Preguntá algo…"
          className="flex-1 rounded-full border border-border bg-paper px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
        />
        <button
          onClick={() => void handleSend()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white"
        >
          <Send size={17} />
        </button>
      </div>
    </div>
  )
}
