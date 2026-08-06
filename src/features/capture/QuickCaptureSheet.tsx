import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Camera, FileText, Link2, Mic, NotebookPen, Paperclip, Square } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { FieldGroup, Input, Label, Select, Textarea } from '@/components/ui/Field'
import { subjectsRepo } from '@/services/db/repositories'
import { sendFileMessage, sendLinkMessage, sendTextMessage } from '@/features/subjects/chat/api'
import { useAudioRecorder } from './useAudioRecorder'
import { useQuickCaptureStore } from '@/app/providers/quickCaptureStore'

type CaptureType = 'nota' | 'foto' | 'archivo' | 'audio' | 'enlace'

const TYPE_OPTIONS: { type: CaptureType; label: string; icon: typeof NotebookPen }[] = [
  { type: 'nota', label: 'Nota', icon: NotebookPen },
  { type: 'foto', label: 'Foto', icon: Camera },
  { type: 'archivo', label: 'Archivo', icon: Paperclip },
  { type: 'audio', label: 'Audio', icon: Mic },
  { type: 'enlace', label: 'Enlace', icon: Link2 },
]

export function QuickCaptureSheet() {
  const { open, close } = useQuickCaptureStore()
  const subjects = useLiveQuery(() => subjectsRepo.listActive(), [])
  const [type, setType] = useState<CaptureType | null>(null)
  const [subjectId, setSubjectId] = useState<string>('')
  const [text, setText] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recorder = useAudioRecorder()

  function reset() {
    setType(null)
    setText('')
    setLinkUrl('')
    setFile(null)
    setError(null)
    recorder.reset()
  }

  function handleClose() {
    reset()
    close()
  }

  async function handleSubmit() {
    setError(null)
    setSubmitting(true)
    const scope = subjectId || null
    try {
      if (type === 'nota') {
        if (!text.trim()) throw new Error('Escribí algo antes de guardar.')
        await sendTextMessage(scope, text.trim())
      } else if (type === 'enlace') {
        if (!linkUrl.trim()) throw new Error('Pegá un enlace.')
        await sendLinkMessage({ subjectId: scope, url: linkUrl.trim(), title: text.trim() || linkUrl.trim() })
      } else if (type === 'foto' || type === 'archivo') {
        if (!file) throw new Error('Elegí un archivo.')
        await sendFileMessage({ subjectId: scope, type, file, caption: text.trim() })
      } else if (type === 'audio') {
        if (!recorder.blob) throw new Error('Grabá un audio antes de guardar.')
        const audioFile = new File([recorder.blob], `audio-${Date.now()}.webm`, {
          type: recorder.blob.type || 'audio/webm',
        })
        await sendFileMessage({ subjectId: scope, type: 'audio', file: audioFile, caption: text.trim() })
      }
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.')
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit =
    type === 'nota'
      ? text.trim().length > 0
      : type === 'enlace'
        ? linkUrl.trim().length > 0
        : type === 'audio'
          ? Boolean(recorder.blob)
          : Boolean(file)

  return (
    <Sheet open={open} onClose={handleClose} title="Captura rápida">
      {!type ? (
        <div className="grid grid-cols-3 gap-3">
          {TYPE_OPTIONS.map(({ type: t, label, icon: Icon }) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border p-4 text-sm font-medium text-ink hover:border-accent hover:bg-accent-soft"
            >
              <Icon size={22} />
              {label}
            </button>
          ))}
        </div>
      ) : (
        <div>
          <FieldGroup>
            <Label>Guardar en</Label>
            <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">Bandeja general</option>
              {subjects?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </FieldGroup>

          {type === 'nota' && (
            <FieldGroup>
              <Label>Nota</Label>
              <Textarea
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ej: preguntar la próxima clase si entra movimiento circular"
              />
            </FieldGroup>
          )}

          {type === 'enlace' && (
            <>
              <FieldGroup>
                <Label>Enlace</Label>
                <Input
                  autoFocus
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://…"
                />
              </FieldGroup>
              <FieldGroup>
                <Label>Título (opcional)</Label>
                <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Aula virtual" />
              </FieldGroup>
            </>
          )}

          {(type === 'foto' || type === 'archivo') && (
            <FieldGroup>
              <Label>{type === 'foto' ? 'Fotografía' : 'Archivo'}</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept={type === 'foto' ? 'image/*' : undefined}
                capture={type === 'foto' ? 'environment' : undefined}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-6 text-sm text-muted hover:border-accent"
              >
                {type === 'foto' ? <Camera size={18} /> : <FileText size={18} />}
                {file ? file.name : type === 'foto' ? 'Tomar o elegir foto' : 'Elegir archivo'}
              </button>
              <Textarea
                className="mt-3"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Comentario (opcional)"
              />
            </FieldGroup>
          )}

          {type === 'audio' && (
            <FieldGroup>
              <Label>Audio</Label>
              <div className="flex flex-col items-center gap-3 rounded-xl border border-border py-6">
                {recorder.status !== 'recording' ? (
                  <button
                    onClick={() => void recorder.start()}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white"
                  >
                    <Mic size={22} />
                  </button>
                ) : (
                  <button
                    onClick={recorder.stop}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-danger text-white"
                  >
                    <Square size={20} />
                  </button>
                )}
                <p className="text-sm text-muted">
                  {recorder.status === 'recording'
                    ? `Grabando… ${Math.floor(recorder.durationMs / 1000)}s`
                    : recorder.blob
                      ? 'Audio listo'
                      : 'Tocá para grabar'}
                </p>
                {recorder.error && <p className="text-sm text-danger">{recorder.error}</p>}
              </div>
            </FieldGroup>
          )}

          {error && <p className="mb-3 text-sm text-danger">{error}</p>}

          <div className="mt-2 flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setType(null)}>
              Atrás
            </Button>
            <Button className="flex-1" disabled={!canSubmit || submitting} onClick={() => void handleSubmit()}>
              {submitting ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  )
}
