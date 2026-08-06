import { useState, type FormEvent, type ReactNode } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { FieldGroup, Input, Label } from '@/components/ui/Field'

export function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [signupDone, setSignupDone] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        await signUp(email, password, displayName)
        setSignupDone(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.')
    } finally {
      setSubmitting(false)
    }
  }

  if (signupDone) {
    return (
      <AuthShell>
        <p className="text-center text-sm text-muted">
          Te enviamos un mail a <strong className="text-ink">{email}</strong> para confirmar tu
          cuenta. Abrí el enlace y después volvé a iniciar sesión acá.
        </p>
        <Button className="mt-6 w-full" onClick={() => { setSignupDone(false); setMode('login') }}>
          Volver a iniciar sesión
        </Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <form onSubmit={handleSubmit}>
        {mode === 'signup' && (
          <FieldGroup>
            <Label>Nombre</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Cómo querés que te llamemos"
              required
            />
          </FieldGroup>
        )}
        <FieldGroup>
          <Label>Mail</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vos@ejemplo.com"
            autoComplete="email"
            required
          />
        </FieldGroup>
        <FieldGroup>
          <Label>Contraseña</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            minLength={8}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
          />
        </FieldGroup>

        {error && <p className="mb-4 text-sm text-danger">{error}</p>}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Un momento…' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
        </Button>
      </form>

      <button
        className="mt-5 w-full text-center text-sm text-muted hover:text-ink"
        onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null) }}
      >
        {mode === 'login' ? '¿No tenés cuenta? Creá una' : '¿Ya tenés cuenta? Iniciá sesión'}
      </button>
    </AuthShell>
  )
}

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-paper px-6 pt-[max(env(safe-area-inset-top),2.5rem)] pb-[max(env(safe-area-inset-bottom),2.5rem)]">
      <div className="animate-fade-in mb-8 flex flex-col items-center gap-3">
        <img src="/estudiarioimg1.png" alt="" className="h-20 w-20 object-contain" />
        <h1 className="text-2xl font-bold tracking-tight">Estudiario</h1>
        <p className="max-w-[22rem] text-center text-sm text-muted">
          Un espacio propio para organizar tu semana de estudio. Tu cuenta y tus datos son
          privados: solo vos podés verlos.
        </p>
      </div>
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-sm)]">
        {children}
      </div>
    </div>
  )
}
