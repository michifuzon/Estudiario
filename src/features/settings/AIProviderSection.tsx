import { useLiveQuery } from 'dexie-react-hooks'
import { aiSettingsRepo } from '@/services/db/repositories'
import { isSupabaseConfigured } from '@/services/supabase/client'
import { Card } from '@/components/ui/Card'
import { Label, Select } from '@/components/ui/Field'
import type { AIProviderKind } from '@/types/domain'

const PROVIDER_LABEL: Record<AIProviderKind, string> = {
  ninguno: 'Ninguno (modo sin IA paga)',
  anthropic: 'Anthropic (Claude)',
  openai: 'OpenAI',
  google: 'Google (Gemini)',
  local: 'Servidor propio (Ollama u otro)',
}

export function AIProviderSection() {
  const settings = useLiveQuery(() => aiSettingsRepo.get(), [])
  if (!settings) return null

  return (
    <Card>
      <h3 className="font-medium text-ink">Inteligencia artificial</h3>
      <p className="mt-1 text-sm text-muted">
        Estudiario funciona por completo sin IA paga. Si querés resúmenes, flashcards o el asistente
        conversacional, podés conectar tu propia clave — nunca se comparte con nadie más ni se usa para otra cosa.
      </p>

      <div className="mt-4">
        <Label>Proveedor</Label>
        <Select
          value={settings.provider}
          onChange={(e) => void aiSettingsRepo.update({ provider: e.target.value as AIProviderKind })}
        >
          {Object.entries(PROVIDER_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      {settings.provider !== 'ninguno' && (
        <p className="mt-3 rounded-xl bg-paper px-3 py-2.5 text-sm text-muted">
          {isSupabaseConfigured
            ? 'Para cargar tu clave de forma segura necesitamos la función de servidor de la Etapa 2 (todavía no está activa). Por ahora quedó guardada la preferencia de proveedor.'
            : 'Conectá primero un proyecto de Supabase (ver README) para poder guardar tu clave de forma segura y usar estas funciones.'}
        </p>
      )}
    </Card>
  )
}
