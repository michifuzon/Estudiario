import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { useAuth } from '@/app/providers/AuthProvider'
import { ProfileSection } from './ProfileSection'
import { AvailabilitySection } from './AvailabilitySection'
import { SemestersSection } from './SemestersSection'
import { AIProviderSection } from './AIProviderSection'
import { DemoDataSection } from './DemoDataSection'
import { DataSection } from './DataSection'
import { SyncStatusSection } from './SyncStatusSection'

export function SettingsScreen() {
  const { isAdmin } = useAuth()

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <PageHeader title="Configuración" subtitle="Tu perfil, disponibilidad y preferencias." />
      <p className="mt-1 text-xs text-subtle">
        ¿Buscás el modo claro/oscuro? Ahora está siempre a mano arriba, en Inicio.
      </p>

      <div className="mt-5 flex flex-col gap-4">
        <SyncStatusSection />
        <ProfileSection />
        <AvailabilitySection />
        <SemestersSection />
        <AIProviderSection />
        <DemoDataSection />
        <DataSection />

        {isAdmin && (
          <Link
            to="/admin"
            className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 text-sm font-medium text-ink"
          >
            <ShieldCheck size={18} className="text-accent" />
            Panel de administración
          </Link>
        )}
      </div>
    </div>
  )
}
