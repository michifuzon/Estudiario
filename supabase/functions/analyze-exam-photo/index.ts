// Edge Function: interpreta una fotografía académica (pizarrón, aviso,
// guía) o un pedido de texto libre ("agendá un parcial de Física para el
// 18/8") y propone datos de un evento (materia, tipo, fecha, temas). Nunca
// crea nada por su cuenta — devuelve una propuesta que el frontend muestra
// para confirmar o corregir antes de guardar.
//
// La clave de IA del usuario se lee server-side (rol service_role) con
// get_decrypted_ai_key(), nunca se envía al navegador.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

const RESULT_SCHEMA = `{
  "subjectGuess": string o null (nombre de la materia si se menciona o se puede inferir),
  "eventType": uno de "parcial" | "final" | "recuperatorio" | "entrega" | "trabajo_practico" | "presentacion" | "clase" | "inscripcion" | "recordatorio", o null si no aplica,
  "title": string breve,
  "date": string en formato YYYY-MM-DD o null si no hay fecha reconocible,
  "topics": string con los temas o unidades mencionadas, o "" si no hay,
  "notes": string con cualquier indicación adicional, o "" si no hay,
  "confidence": "alta" | "media" | "baja"
}`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'No autorizado' }, 401)

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: userData, error: userError } = await userClient.auth.getUser()
    if (userError || !userData.user) return json({ error: 'No autorizado' }, 401)

    const body = await req.json()
    const imageBase64: string | undefined = body.imageBase64
    const mimeType: string | undefined = body.mimeType
    const text: string | undefined = body.text
    if (!imageBase64 && !text?.trim()) return json({ error: 'Falta la imagen o el texto a interpretar.' }, 400)

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const { data: keyRows, error: keyError } = await adminClient.rpc('get_decrypted_ai_key', {
      p_user_id: userData.user.id,
    })
    if (keyError || !keyRows?.length) {
      return json({ error: 'No tenés una clave de IA configurada en Ajustes.' }, 400)
    }
    const { provider, model, api_key: apiKey } = keyRows[0] as {
      provider: string
      model: string
      api_key: string
    }

    const today = new Date().toISOString().slice(0, 10)
    const prompt = imageBase64
      ? `Analizá esta fotografía de un contexto académico universitario (pizarrón, aviso, guía, etc.).${
          text ? ` La persona agregó esta nota: "${text}".` : ''
        }
Devolvé SOLO un objeto JSON, sin texto adicional ni markdown, con esta forma exacta:
${RESULT_SCHEMA}
Hoy es ${today}; si el texto no aclara el año, asumí el actual o el próximo según corresponda.`
      : `Interpretá este pedido en español de una persona organizando su semana de estudio: "${text}".
Devolvé SOLO un objeto JSON, sin texto adicional ni markdown, con esta forma exacta:
${RESULT_SCHEMA}
Hoy es ${today}; interpretá fechas relativas ("el viernes que viene", "en dos semanas") en base a esa fecha. Si el pedido no describe un evento de calendario, poné todos los campos en null salvo "notes", donde podés explicar brevemente por qué, y "confidence": "baja".`

    let rawText: string
    if (provider === 'openai') {
      rawText = await callOpenAI(apiKey, model, prompt, imageBase64, mimeType)
    } else if (provider === 'google') {
      rawText = await callGemini(apiKey, model, prompt, imageBase64, mimeType)
    } else if (provider === 'anthropic') {
      rawText = await callAnthropic(apiKey, model, prompt, imageBase64, mimeType)
    } else {
      return json({ error: 'Ese proveedor todavía no está soportado acá.' }, 400)
    }

    const match = rawText.match(/\{[\s\S]*\}/)
    if (!match) return json({ error: 'La IA no devolvió un resultado interpretable.' }, 502)

    return json({ result: JSON.parse(match[0]) })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Error inesperado' }, 500)
  }
})

async function callOpenAI(key: string, model: string, prompt: string, imageBase64?: string, mimeType?: string) {
  const content: unknown[] = [{ type: 'text', text: prompt }]
  if (imageBase64 && mimeType) {
    content.push({ type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } })
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: [{ role: 'user', content }],
      max_tokens: 500,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message ?? 'Error llamando a OpenAI')
  return data.choices[0].message.content as string
}

async function callGemini(key: string, model: string, prompt: string, imageBase64?: string, mimeType?: string) {
  const modelId = model || 'gemini-2.0-flash'
  const parts: unknown[] = [{ text: prompt }]
  if (imageBase64 && mimeType) parts.push({ inline_data: { mime_type: mimeType, data: imageBase64 } })
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    },
  )
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message ?? 'Error llamando a Gemini')
  return data.candidates[0].content.parts[0].text as string
}

async function callAnthropic(key: string, model: string, prompt: string, imageBase64?: string, mimeType?: string) {
  const content: unknown[] = []
  if (imageBase64 && mimeType) {
    content.push({ type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } })
  }
  content.push({ type: 'text', text: prompt })
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'claude-sonnet-5',
      max_tokens: 500,
      messages: [{ role: 'user', content }],
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message ?? 'Error llamando a Anthropic')
  return data.content[0].text as string
}
