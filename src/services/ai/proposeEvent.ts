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
  if (error) throw new Error(await extractFunctionErrorMessage(error))
  if (data?.error) throw new Error(data.error)
  return data.result as EventProposal
}

/**
 * supabase-js solo expone un mensaje genérico ("Edge Function returned a
 * non-2xx status code") en `error.message` — el detalle real que devolvió
 * nuestra función (ej. "no tenés una clave configurada") viaja en el body
 * de la respuesta, colgado de `error.context`. Lo leemos de ahí para poder
 * mostrar algo útil.
 */
async function extractFunctionErrorMessage(error: unknown): Promise<string> {
  const withContext = error as { message?: string; context?: Response }
  if (withContext?.context && typeof withContext.context.json === 'function') {
    try {
      const body = await withContext.context.clone().json()
      if (body?.error) return body.error as string
    } catch {
      // el body no era JSON — seguimos con el mensaje genérico
    }
  }
  return withContext?.message ?? 'No se pudo interpretar el pedido.'
}
