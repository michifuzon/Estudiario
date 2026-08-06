import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { isDemoDataPresent, removeDemoData, seedDemoData } from '@/services/demoData'

export function DemoDataSection() {
  const [present, setPresent] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    void isDemoDataPresent().then(setPresent)
  }, [])

  async function toggle() {
    setLoading(true)
    try {
      if (present) {
        await removeDemoData()
        setPresent(false)
      } else {
        await seedDemoData()
        setPresent(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <h3 className="font-medium text-ink">Datos de ejemplo</h3>
      <p className="mt-1 text-sm text-muted">
        Materias de prueba (Física, Matemática, Diseño, Tecnología) para ver la app funcionando.
      </p>
      <Button variant="secondary" className="mt-3" onClick={() => void toggle()} disabled={loading || present === null}>
        {loading ? 'Un momento…' : present ? 'Quitar datos de ejemplo' : 'Cargar datos de ejemplo'}
      </Button>
    </Card>
  )
}
