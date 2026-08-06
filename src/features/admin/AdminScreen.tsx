import { useEffect, useState } from 'react'
import { ShieldCheck, ShieldOff } from 'lucide-react'
import { useAuth } from '@/app/providers/AuthProvider'
import { supabase } from '@/services/supabase/client'
import { mapAdminUserStatRow, type AdminUserStatRow } from '@/services/supabase/mappers'
import type { AdminUserStat } from '@/types/auth'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/PageHeader'

export function AdminScreen() {
  const { isAdmin, isLocalMode } = useAuth()
  const [stats, setStats] = useState<AdminUserStat[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAdmin || !supabase) return
    supabase
      .rpc('admin_get_user_stats')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setStats(((data ?? []) as AdminUserStatRow[]).map(mapAdminUserStatRow))
      })
  }, [isAdmin])

  if (isLocalMode) {
    return (
      <EmptyState
        icon={<ShieldOff size={28} />}
        title="Panel de administración no disponible"
        description="Se activa cuando la app está conectada a un proyecto de Supabase con cuentas reales."
      />
    )
  }

  if (!isAdmin) {
    return (
      <EmptyState
        icon={<ShieldOff size={28} />}
        title="Acceso restringido"
        description="Esta sección es solo para la cuenta de administración."
      />
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <PageHeader
        icon={<ShieldCheck size={20} />}
        title="Administración"
        subtitle="Cuentas registradas y actividad general."
      />

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      {!stats ? (
        <p className="mt-6 text-sm text-muted">Cargando…</p>
      ) : stats.length === 0 ? (
        <EmptyState title="Todavía no hay cuentas registradas" />
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {stats.map((s) => (
            <Card key={s.userId}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-ink">{s.displayName || s.email}</p>
                  <p className="text-sm text-muted">{s.email}</p>
                </div>
                <Badge tone={s.emailConfirmed ? 'success' : 'warning'}>
                  {s.emailConfirmed ? 'Mail verificado' : 'Sin verificar'}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
                <Stat label="Materias" value={s.subjectCount} />
                <Stat label="Eventos" value={s.eventCount} />
                <Stat label="Mensajes" value={s.chatMessageCount} />
              </div>
              <p className="mt-3 text-xs text-subtle">
                {s.career && `${s.career} · `}
                Se unió el {new Date(s.joinedAt).toLocaleDateString('es-AR')}
                {s.lastSignInAt &&
                  ` · último ingreso ${new Date(s.lastSignInAt).toLocaleDateString('es-AR')}`}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-paper px-2 py-2">
      <p className="text-lg font-serif text-ink">{value}</p>
      <p className="text-xs text-subtle">{label}</p>
    </div>
  )
}
