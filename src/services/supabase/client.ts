import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * Cliente de Supabase, o `null` si todavía no se cargaron
 * VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en el entorno (ver README).
 * La clave "anon" está diseñada para viajar en el frontend: el acceso real
 * a los datos lo controla Row Level Security en Postgres, no el secreto de
 * esta clave. Ninguna clave de IA ni ninguna clave "service role" debe vivir
 * acá — esas quedan del lado del servidor (supabase/functions).
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string)
  : null
