import { useState } from 'react'
import { MailCheck } from 'lucide-react'
import { useAuth } from '@/app/providers/AuthProvider'
import { Button } from '@/components/ui/Button'

export function VerifyEmailScreen() {
  const { user, resendVerification, signOut } = useAuth()
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleResend() {
    setError(null)
    try {
      await resendVerification()
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reenviar el mail.')
    }
  }

  return (
    <div className="safe-top safe-bottom flex min-h-full flex-col items-center justify-center gap-4 bg-paper px-6 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent-soft text-accent-ink">
        <MailCheck size={26} />
      </div>
      <h1 className="text-xl font-bold">Confirmá tu mail</h1>
      <p className="max-w-sm text-sm text-muted">
        Te enviamos un enlace de confirmación a <strong className="text-ink">{user?.email}</strong>.
        Abrilo desde tu casilla y volvé a esta pantalla.
      </p>
      {sent && <p className="text-sm text-success">Reenviamos el mail de confirmación.</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="mt-2 flex gap-3">
        <Button variant="secondary" onClick={handleResend}>
          Reenviar mail
        </Button>
        <Button variant="ghost" onClick={() => void signOut()}>
          Cerrar sesión
        </Button>
      </div>
    </div>
  )
}
