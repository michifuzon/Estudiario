import { useEffect, useState } from 'react'
import { CloudOff, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { getSyncStatus, type SyncStatus } from '@/services/sync/engine'

export function SyncStatusSection() {
  const [status, setStatus] = useState<SyncStatus | null>(null)

  useEffect(() => {
    void getSyncStatus().then(setStatus)
  }, [])

  if (!status) return null

  return (
    <Card className="flex items-center gap-3">
      {status.mode === 'local' ? (
        <CloudOff size={18} className="shrink-0 text-subtle" />
      ) : (
        <RefreshCw size={18} className="shrink-0 text-accent" />
      )}
      <div className="text-sm">
        <p className="text-ink">{status.mode === 'local' ? 'Guardado solo en este dispositivo' : 'Sincronizado con tu cuenta'}</p>
        {status.pendingChanges > 0 && (
          <p className="text-xs text-muted">{status.pendingChanges} cambios sin sincronizar</p>
        )}
      </div>
    </Card>
  )
}
