import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { Camera, Send, Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { aiSettingsRepo, assistantMessagesRepo } from '@/services/db/repositories'
import { answerLocally } from '@/services/assistant/ruleBasedAssistant'
import { proposeEventFromInput, type EventProposal } from '@/services/ai/proposeEvent'
import { EventProposalCard } from './EventProposalCard'
import type { AssistantMessage } from '@/types/domain'

const SUGGESTIONS = [
  '¿Qué tengo que estudiar hoy?',
  '¿Cuánto falta para el parcial?',
  '¿Qué materia debería priorizar?',
  'Agendá un parcial de Física para el viernes',
]

export function AssistantScreen() {
  const aiSettings = useLiveQuery(() => aiSettingsRepo.get(), [])
  const turns = useLiveQuery(() => assistantMessagesRepo.list(), [])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const hasProvider = aiSettings && aiSettings.provider !== 'ninguno' && aiSettings.hasKeyConfigured

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [turns?.length])

  async function handleSend(text?: string) {
    const value = (text ?? input).trim()
    if (!value || busy) return
    setInput('')
    await assistantMessagesRepo.add('user', value)

    const local = await answerLocally(value)
    if (local) {
      await assistantMessagesRepo.add('assistant', local)
      return
    }

    if (!hasProvider) {
      await assistantMessagesRepo.add(
        'assistant',
        'Todavía no tengo una respuesta preparada para eso sin conectar un proveedor de IA. Podés preguntarme qué estudiar hoy, cuánto falta para un parcial o qué materia priorizar — o cargar tu clave en Configuración para pedidos más flexibles, como agendar un parcial.',
      )
      return
    }

    setBusy(true)
    try {
      const proposal = await proposeEventFromInput({ text: value })
      if (proposal.eventType || proposal.date) {
        await assistantMessagesRepo.add('assistant', 'Esto es lo que entendí:', proposal)
      } else {
        await assistantMessagesRepo.add('assistant', proposal.notes || 'No pude interpretar un evento ahí.')
      }
    } catch (err) {
      await assistantMessagesRepo.add(
        'assistant',
        err instanceof Error ? err.message : 'No pude procesar el pedido.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function handlePhoto(file: File | null) {
    if (!file) return
    if (!hasProvider) {
      await assistantMessagesRepo.add(
        'assistant',
        'Para interpretar fotos necesitás cargar una clave de IA en Configuración primero.',
      )
      return
    }
    await assistantMessagesRepo.add('user', '📷 Foto enviada')
    setBusy(true)
    try {
      const proposal = await proposeEventFromInput({ file })
      if (proposal.eventType || proposal.date) {
        await assistantMessagesRepo.add('assistant', 'Esto es lo que encontré en la foto:', proposal)
      } else {
        await assistantMessagesRepo.add(
          'assistant',
          proposal.notes || 'No pude reconocer una fecha o un evento claro en esa foto.',
        )
      }
    } catch (err) {
      await assistantMessagesRepo.add('assistant', err instanceof Error ? err.message : 'No pude analizar la foto.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col px-4 py-6">
      <PageHeader icon={<Sparkles size={20} />} title="Asistente" subtitle="Preguntá sobre tus materias, fechas y plan de estudio." />

      {!hasProvider && (
        <div className="mt-4 rounded-xl border border-border bg-surface-raised px-4 py-3 text-sm text-muted">
          Estás en modo sin IA paga: respondo lo que puedo calcular con tus propios datos. Para agendar cosas
          por texto o foto, cargá tu propia clave en{' '}
          <Link to="/configuracion" className="text-accent underline">
            Configuración
          </Link>
          .
        </div>
      )}

      <div className="mt-4 min-h-[40vh]">
        {!turns?.length ? (
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
            {turns.map((turn) => (
              <TurnBubble key={turn.id} turn={turn} />
            ))}
            {busy && <div className="flex justify-start text-sm text-subtle">Pensando…</div>}
            {!hasProvider && <Badge tone="neutral">Respuestas locales, sin IA</Badge>}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="sticky bottom-16 z-10 mt-4 flex items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2.5 shadow-[var(--shadow-md)] sm:bottom-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            void handlePhoto(e.target.files?.[0] ?? null)
            if (fileInputRef.current) fileInputRef.current.value = ''
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          aria-label="Enviar foto"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-accent-soft"
        >
          <Camera size={18} />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void handleSend()}
          placeholder="Preguntá o pedime que agende algo…"
          className="flex-1 bg-transparent text-sm focus:outline-none"
        />
        <button
          onClick={() => void handleSend()}
          disabled={busy}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}

function TurnBubble({ turn }: { turn: AssistantMessage }) {
  if (turn.role === 'assistant' && turn.proposal) {
    return (
      <div className="flex justify-start">
        <EventProposalCard proposal={turn.proposal as EventProposal} onDone={() => void 0} />
      </div>
    )
  }
  return (
    <div className={turn.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
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
  )
}
