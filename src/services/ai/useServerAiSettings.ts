import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/services/supabase/client'
import { useAuth } from '@/app/providers/AuthProvider'
import type { AIProviderKind } from '@/types/domain'

export interface ServerAiSettings {
  provider: AIProviderKind
  model: string
  hasKeyConfigured: boolean
}

/**
 * Estado real de la clave de IA, leído directo de Supabase (fuente de
 * verdad) en vez de la copia local en Dexie — esa copia puede quedar
 * desactualizada (otra sesión, otro dispositivo, o el guardado se hizo
 * antes de que existiera este chequeo) y hacía que el Asistente creyera
 * que no había clave aunque sí estuviera guardada del lado del servidor.
 */
export function useServerAiSettings(): {
  settings: ServerAiSettings | null
  loading: boolean
  refetch: () => Promise<void>
} {
  const { user, isLocalMode } = useAuth()
  const [settings, setSettings] = useState<ServerAiSettings | null>(null)
  const [loading, setLoading] = useState(!isLocalMode)

  const refetch = useCallback(async () => {
    if (isLocalMode || !supabase || !user) {
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('ai_provider_settings')
      .select('provider, model, has_key_configured')
      .eq('user_id', user.id)
      .maybeSingle()
    setSettings(
      data
        ? {
            provider: data.provider as AIProviderKind,
            model: data.model ?? '',
            hasKeyConfigured: data.has_key_configured ?? false,
          }
        : { provider: 'ninguno', model: '', hasKeyConfigured: false },
    )
    setLoading(false)
  }, [isLocalMode, user])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { settings, loading, refetch }
}
