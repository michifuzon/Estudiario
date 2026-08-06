import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { KeyRound, ShieldCheck } from 'lucide-react'
import { aiSettingsRepo } from '@/services/db/repositories'
import { isSupabaseConfigured, supabase } from '@/services/supabase/client'
import { useAuth } from '@/app/providers/AuthProvider'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FieldGroup, Input, Label, Select } from '@/components/ui/Field'
import type { AIProviderKind } from '@/types/domain'

const PROVIDER_LABEL: Record<AIProviderKind, string> = {
  ninguno: 'Ninguno (modo sin IA paga)',
  anthropic: 'Anthropic (Claude)',
  openai: 'OpenAI',
  google: 'Google (Gemini)',
  local: 'Servidor propio (Ollama u otro)',
}

const MODEL_PLACEHOLDER: Partial<Record<AIProviderKind, string>> = {
  anthropic: 'claude-sonnet-5',
  openai: 'gpt-5',
  google: 'gemini-2.5-pro',
}

export function AIProviderSection() {
  const { isLocalMode } = useAuth()
  const settings = useLiveQuery(() => aiSettingsRepo.get(), [])
  const [provider, setProvider] = useState<AIProviderKind>('ninguno')
  const [model, setModel] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedJustNow, setSavedJustNow] = useState(false)

  if (!settings) return null

  async function handleSave() {
    if (!supabase || provider === 'ninguno' || !apiKey.trim()) return
    setError(null)
    setSaving(true)
    try {
      const { error: rpcError } = await supabase.rpc('save_ai_key', {
        p_provider: provider,
        p_model: model.trim() || MODEL_PLACEHOLDER[provider] || '',
        p_api_key: apiKey.trim(),
      })
      if (rpcError) throw rpcError
      await aiSettingsRepo.update({ provider, model: model.trim(), hasKeyConfigured: true })
      setApiKey('')
      setSavedJustNow(true)
      setTimeout(() => setSavedJustNow(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la clave.')
    } finally {
      setSaving(false)
    }
  }

  async function handleClear() {
    if (!supabase) return
    setSaving(true)
    try {
      const { error: rpcError } = await supabase.rpc('clear_ai_key')
      if (rpcError) throw rpcError
      await aiSettingsRepo.update({ provider: 'ninguno', model: '', hasKeyConfigured: false })
      setProvider('ninguno')
      setModel('')
    } finally {
      setSaving(false)
    }
  }

  const canManageKey = isSupabaseConfigured && !isLocalMode

  return (
    <Card>
      <h3 className="font-medium text-ink">Inteligencia artificial</h3>
      <p className="mt-1 text-sm text-muted">
        Estudiario funciona por completo sin IA paga. Si querés resúmenes, flashcards o el asistente
        conversacional, podés conectar tu propia clave — se guarda encriptada y solo el servidor la usa
        para llamar al proveedor que elijas.
      </p>

      {settings.hasKeyConfigured && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-success/10 px-3 py-2.5 text-sm text-ink">
          <ShieldCheck size={16} className="shrink-0 text-success" />
          Tenés una clave de {PROVIDER_LABEL[settings.provider]} guardada
          {settings.model ? ` (${settings.model})` : ''}.
          <button onClick={() => void handleClear()} disabled={saving} className="ml-auto text-xs font-medium text-danger">
            Quitar
          </button>
        </div>
      )}

      {!canManageKey ? (
        <p className="mt-3 rounded-xl bg-paper px-3 py-2.5 text-sm text-muted">
          {isSupabaseConfigured
            ? 'Iniciá sesión con tu cuenta para poder guardar una clave de forma segura.'
            : 'Conectá primero un proyecto de Supabase (ver README) para poder guardar tu clave de forma segura.'}
        </p>
      ) : (
        !settings.hasKeyConfigured && (
          <div className="mt-4">
            <FieldGroup>
              <Label>Proveedor</Label>
              <Select value={provider} onChange={(e) => setProvider(e.target.value as AIProviderKind)}>
                {Object.entries(PROVIDER_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </FieldGroup>

            {provider !== 'ninguno' && (
              <>
                <FieldGroup>
                  <Label>Modelo (opcional)</Label>
                  <Input
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder={MODEL_PLACEHOLDER[provider] ?? 'nombre del modelo'}
                  />
                </FieldGroup>
                <FieldGroup>
                  <Label>Tu clave de API</Label>
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-…"
                    autoComplete="off"
                  />
                </FieldGroup>

                {error && <p className="mb-3 text-sm text-danger">{error}</p>}
                {savedJustNow && <p className="mb-3 text-sm text-success">Clave guardada de forma segura.</p>}

                <Button size="sm" disabled={!apiKey.trim() || saving} onClick={() => void handleSave()}>
                  <KeyRound size={14} />
                  {saving ? 'Guardando…' : 'Guardar clave'}
                </Button>
              </>
            )}
          </div>
        )
      )}
    </Card>
  )
}
