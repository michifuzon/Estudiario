import { useEffect } from 'react'
import { PartyPopper, X } from 'lucide-react'
import { useAuth } from '@/app/providers/AuthProvider'

/** Saludo breve que aparece una vez, justo después de confirmar el mail y volver a la app. */
export function WelcomeToast() {
  const { justConfirmed, dismissJustConfirmed } = useAuth()

  useEffect(() => {
    if (!justConfirmed) return
    const timeout = setTimeout(dismissJustConfirmed, 5000)
    return () => clearTimeout(timeout)
  }, [justConfirmed, dismissJustConfirmed])

  if (!justConfirmed) return null

  return (
    <div className="animate-fade-in fixed inset-x-4 top-[max(env(safe-area-inset-top),1rem)] z-50 mx-auto flex max-w-sm items-center gap-2.5 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 shadow-[var(--shadow-md)] sm:left-auto sm:right-6 sm:inset-x-auto">
      <PartyPopper size={18} className="shrink-0 text-success" />
      <p className="flex-1 text-sm text-ink">¡Perfecto, ya estás registrado/a! Bienvenido/a a Estudiario.</p>
      <button onClick={dismissJustConfirmed} aria-label="Cerrar" className="shrink-0 text-muted hover:text-ink">
        <X size={15} />
      </button>
    </div>
  )
}
