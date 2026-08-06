import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { clearAllData, exportAllData } from '@/services/db/exportImport'

export function DataSection() {
  const [deleting, setDeleting] = useState(false)

  async function handleExport() {
    const blob = await exportAllData()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `estudiario-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleDelete() {
    if (!window.confirm('Esto borra todos tus datos guardados en este dispositivo. ¿Confirmás?')) return
    setDeleting(true)
    try {
      await clearAllData()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card>
      <h3 className="font-medium text-ink">Tus datos</h3>
      <p className="mt-1 text-sm text-muted">
        Todo lo que cargás vive en este dispositivo (y en tu cuenta, si conectaste Supabase). Podés
        descargar una copia o borrar todo en cualquier momento.
      </p>
      <div className="mt-3 flex gap-2">
        <Button variant="secondary" onClick={() => void handleExport()}>
          Exportar datos
        </Button>
        <Button variant="danger" onClick={() => void handleDelete()} disabled={deleting}>
          {deleting ? 'Borrando…' : 'Borrar todo'}
        </Button>
      </div>
    </Card>
  )
}
