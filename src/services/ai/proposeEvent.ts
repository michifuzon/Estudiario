import { supabase } from '@/services/supabase/client'
import type { EventType } from '@/types/domain'

export interface EventProposal {
  subjectGuess: string | null
  eventType: EventType | null
  title: string
  date: string | null
  topics: string
  notes: string
  confidence: 'alta' | 'media' | 'baja'
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  let binary = ''
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

/**
 * Le pide a la Edge Function `analyze-exam-photo` que interprete una foto
 * y/o un pedido de texto, y devuelva una propuesta de evento. Nunca crea
 * nada: eso lo hace quien llama, después de que el usuario confirme.
 */
export async function proposeEventFromInput(params: {
  file?: File
  text?: string
}): Promise<EventProposal> {
  if (!supabase) throw new Error('Supabase no está configurado.')

  const body: Record<string, unknown> = {}
  if (params.file) {
    body.imageBase64 = await fileToBase64(params.file)
    body.mimeType = params.file.type || 'image/jpeg'
  }
  if (params.text?.trim()) body.text = params.text.trim()

  const { data, error } = await supabase.functions.invoke('analyze-exam-photo', { body })
  if (error) throw new Error(error.message ?? 'No se pudo interpretar el pedido.')
  if (data?.error) throw new Error(data.error)
  return data.result as EventProposal
}
