import { useEffect, useState } from 'react'
import { CloudOff, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getSyncStatus, type SyncStatus } from '@/services/sync/engine'
import { pushAllLocalData } from '@/services/sync/push'
import { useAuth } from '@/app/providers/AuthProvider'

export function SyncStatusSection() {
  const { user, isLocalMode } = useAuth()
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  useEffect(() => {
    void getSyncStatus().then(setStatus)
  }, [])

  async function handleResync() {
    if (!user) return
    setSyncing(true)
    setResult(null)
    try {
      const { pushed, failed } = await pushAllLocalData(user.id)
      setResult(failed > 0 ? `${pushed} elementos subidos, ${failed} fallaron (revisá la consola).` : `${pushed} elementos subidos.`)
    } finally {
      setSyncing(false)
    }
  }

  if (!status) return null

  return (
    <Card>
      <div className="flex items-center gap-3">
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
      </div>

      {!isLocalMode && (
        <div className="mt-3">
          <Button size="sm" variant="secondary" onClick={() => void handleResync()} disabled={syncing}>
            {syncing ? 'Subiendo…' : 'Reenviar mis datos a la nube'}
          </Button>
          {result && <p className="mt-2 text-xs text-muted">{result}</p>}
        </div>
      )}
    </Card>
  )
}
