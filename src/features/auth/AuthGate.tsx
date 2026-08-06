import { useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { BrandSplash } from '@/components/BrandSplash'
import { AuthScreen } from './AuthScreen'
import { VerifyEmailScreen } from './VerifyEmailScreen'

const SPLASH_FLAG = 'estudiario-splash-shown'

/**
 * Filtra el acceso a la app según el estado de autenticación.
 * En modo local (sin Supabase conectado) deja pasar directo: no hay cuentas
 * todavía, todo vive en este dispositivo. En ese caso no hay una espera real
 * de sesión, así que mostramos un momento de marca breve una vez por sesión
 * de navegador — no es una demora artificial en cada navegación, solo al abrir.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { status, isLocalMode } = useAuth()
  const [showEntrySplash, setShowEntrySplash] = useState(
    () => isLocalMode && typeof window !== 'undefined' && !sessionStorage.getItem(SPLASH_FLAG),
  )

  useEffect(() => {
    if (!showEntrySplash) return
    sessionStorage.setItem(SPLASH_FLAG, '1')
    const timeout = setTimeout(() => setShowEntrySplash(false), 850)
    return () => clearTimeout(timeout)
  }, [showEntrySplash])

  if (status === 'loading') return <BrandSplash />
  if (status === 'signed-out') return <AuthScreen />
  if (status === 'unverified') return <VerifyEmailScreen />
  if (showEntrySplash) return <BrandSplash tagline="Organizá tu semana académica" />

  return <>{children}</>
}
