import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/services/supabase/client'
import { mapProfileRow, type ProfileRow } from '@/services/supabase/mappers'
import { pullRemoteData } from '@/services/sync/pull'
import { pushAllLocalData } from '@/services/sync/push'
import { ADMIN_EMAIL } from '@/lib/constants'
import type { Profile } from '@/types/auth'

export type AuthStatus = 'loading' | 'local' | 'signed-out' | 'unverified' | 'signed-in'

interface AuthContextValue {
  status: AuthStatus
  user: User | null
  profile: Profile | null
  isAdmin: boolean
  /** true si no hay Supabase conectado: la app funciona solo en este dispositivo, sin cuentas. */
  isLocalMode: boolean
  /** true justo después de confirmar el mail y volver a la app — para mostrar un saludo, una sola vez. */
  justConfirmed: boolean
  dismissJustConfirmed: () => void
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resendVerification: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(isSupabaseConfigured ? 'loading' : 'local')
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [justConfirmed, setJustConfirmed] = useState(false)
  const previousStatusRef = useRef<AuthStatus>(status)

  const loadProfile = useCallback(async (userId: string) => {
    if (!supabase) return
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) setProfile(mapProfileRow(data as ProfileRow))
  }, [])

  const applySession = useCallback(
    async (nextUser: User | null) => {
      const previousStatus = previousStatusRef.current
      setUser(nextUser)
      if (!nextUser) {
        setProfile(null)
        setStatus('signed-out')
        previousStatusRef.current = 'signed-out'
        return
      }
      if (!nextUser.email_confirmed_at) {
        setStatus('unverified')
        previousStatusRef.current = 'unverified'
        return
      }
      await loadProfile(nextUser.id)
      setStatus('signed-in')
      if (previousStatus === 'unverified') setJustConfirmed(true)
      previousStatusRef.current = 'signed-in'
      // Primero trae lo que ya está en la nube (por si este es un
      // dispositivo nuevo o se reinstaló la app), después reenvía
      // cualquier cosa que haya quedado solo local (por ejemplo, datos
      // creados antes de que el guardado remoto funcionara bien). Ambos
      // son upsert por id, así que repetirlo no duplica ni rompe nada.
      void pullRemoteData(nextUser.id).then(() => pushAllLocalData(nextUser.id))
    },
    [loadProfile],
  )

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    supabase.auth.getSession().then(({ data }) => {
      void applySession(data.session?.user ?? null)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session?.user ?? null)
    })

    return () => subscription.subscription.unsubscribe()
  }, [applySession])

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    if (!supabase) throw new Error('Supabase no está configurado')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        // Sin esto, el link del mail de confirmación manda a la Site URL
        // que tenga configurada el proyecto en Supabase (por defecto,
        // localhost) en vez de a la app real.
        emailRedirectTo: window.location.origin,
      },
    })
    if (error) throw error
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase no está configurado')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }, [])

  const resendVerification = useCallback(async () => {
    if (!supabase || !user?.email) return
    const { error } = await supabase.auth.resend({ type: 'signup', email: user.email })
    if (error) throw error
  }, [user])

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id)
  }, [user, loadProfile])

  const dismissJustConfirmed = useCallback(() => setJustConfirmed(false), [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      profile,
      isAdmin: profile?.email === ADMIN_EMAIL,
      isLocalMode: !isSupabaseConfigured,
      justConfirmed,
      dismissJustConfirmed,
      signUp,
      signIn,
      signOut,
      resendVerification,
      refreshProfile,
    }),
    [status, user, profile, justConfirmed, dismissJustConfirmed, signUp, signIn, signOut, resendVerification, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
