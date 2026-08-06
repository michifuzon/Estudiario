import { useRef, useState } from 'react'
import { Camera, Mic, Paperclip, Send, Square } from 'lucide-react'
import { sendFileMessage, sendTextMessage } from './api'
import { useAudioRecorder } from '@/features/capture/useAudioRecorder'

export function ChatComposer({ subjectId }: { subjectId: string | null }) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recorder = useAudioRecorder()

  async function handleSendText() {
    const value = text.trim()
    if (!value) return
    setText('')
    await sendTextMessage(subjectId, value)
  }

  async function handleFile(file: File | null, type: 'foto' | 'archivo') {
    if (!file) return
    setSending(true)
    try {
      await sendFileMessage({ subjectId, type, file })
    } finally {
      setSending(false)
    }
  }

  async function handleAudioDone() {
    if (!recorder.blob) return
    setSending(true)
    try {
      const file = new File([recorder.blob], `audio-${Date.now()}.webm`, { type: recorder.blob.type || 'audio/webm' })
      await sendFileMessage({ subjectId, type: 'audio', file })
      recorder.reset()
    } finally {
      setSending(false)
    }
  }

  if (recorder.status !== 'idle') {
    return (
      <div className="flex items-center gap-3 border-t border-border bg-surface px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
        <span className="flex-1 text-sm text-muted">
          {recorder.status === 'recording'
            ? `Grabando… ${Math.floor(recorder.durationMs / 1000)}s`
            : 'Audio listo para enviar'}
        </span>
        {recorder.status === 'recording' ? (
          <button
            onClick={recorder.stop}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-danger text-white"
          >
            <Square size={16} />
          </button>
        ) : (
          <>
            <button onClick={recorder.reset} className="text-sm text-muted">
              Descartar
            </button>
            <button
              onClick={() => void handleAudioDone()}
              disabled={sending}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white"
            >
              <Send size={16} />
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-end gap-2 border-t border-border bg-surface px-3 pt-2.5 pb-[max(env(safe-area-inset-bottom),0.625rem)]">
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0] ?? null, 'foto').then(() => { if (photoInputRef.current) photoInputRef.current.value = '' })}
      />
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0] ?? null, 'archivo').then(() => { if (fileInputRef.current) fileInputRef.current.value = '' })}
      />
      <button
        onClick={() => photoInputRef.current?.click()}
        aria-label="Tomar foto"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-accent-soft"
      >
        <Camera size={19} />
      </button>
      <button
        onClick={() => fileInputRef.current?.click()}
        aria-label="Adjuntar archivo"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-accent-soft"
      >
        <Paperclip size={19} />
      </button>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            void handleSendText()
          }
        }}
        placeholder="Escribí una nota…"
        rows={1}
        className="max-h-28 min-h-10 flex-1 resize-none rounded-2xl border border-border bg-paper px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
      />
      {text.trim() ? (
        <button
          onClick={() => void handleSendText()}
          aria-label="Enviar"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white"
        >
          <Send size={17} />
        </button>
      ) : (
        <button
          onClick={() => void recorder.start()}
          aria-label="Grabar audio"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-accent-soft"
        >
          <Mic size={19} />
        </button>
      )}
    </div>
  )
}
