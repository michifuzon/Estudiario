import { useCallback, useRef, useState } from 'react'

type RecorderStatus = 'idle' | 'recording' | 'stopped'

/** Grabador de audio simple basado en MediaRecorder, usado por la captura rápida y el chat. */
export function useAudioRecorder() {
  const [status, setStatus] = useState<RecorderStatus>('idle')
  const [durationMs, setDurationMs] = useState(0)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startedAtRef = useRef(0)
  const intervalRef = useRef<number | null>(null)

  const start = useCallback(async () => {
    setError(null)
    setBlob(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        setBlob(new Blob(chunksRef.current, { type: recorder.mimeType }))
        stream.getTracks().forEach((t) => t.stop())
      }
      recorder.start()
      recorderRef.current = recorder
      startedAtRef.current = Date.now()
      setStatus('recording')
      intervalRef.current = window.setInterval(() => {
        setDurationMs(Date.now() - startedAtRef.current)
      }, 200)
    } catch {
      setError('No se pudo acceder al micrófono. Revisá los permisos del navegador.')
    }
  }, [])

  const stop = useCallback(() => {
    recorderRef.current?.stop()
    if (intervalRef.current) window.clearInterval(intervalRef.current)
    setStatus('stopped')
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setDurationMs(0)
    setBlob(null)
    setError(null)
  }, [])

  return { status, durationMs, blob, error, start, stop, reset }
}
