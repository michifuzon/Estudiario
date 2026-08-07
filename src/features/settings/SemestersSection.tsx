import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Archive, Plus } from 'lucide-react'
import { semestersRepo } from '@/services/db/repositories'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'

export function SemestersSection() {
  const semesters = useLiveQuery(() => semestersRepo.listActive(), [])
  const [name, setName] = useState('')

  async function handleAdd() {
    if (!name.trim()) return
    await semestersRepo.create({ name: name.trim(), startDate: null, endDate: null, isArchived: false })
    setName('')
  }

  return (
    <Card>
      <h3 className="font-medium text-ink">Semestres</h3>
      <p className="mt-1 text-sm text-muted">
        Esto es opcional: al crear una materia ya se guarda en un semestre automático, no hace falta
        tocar nada acá. Solo sirve si querés separar materias viejas de las de ahora (por ejemplo, al
        empezar un cuatrimestre nuevo).
      </p>

      <div className="mt-3 flex flex-col gap-1.5">
        {semesters?.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-xl bg-paper px-3 py-2 text-sm">
            <span className="text-ink">{s.name}</span>
            <button onClick={() => void semestersRepo.archive(s.id)} className="text-subtle hover:text-ink" aria-label="Archivar">
              <Archive size={15} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Segundo semestre 2026" />
        <Button size="icon" onClick={() => void handleAdd()} aria-label="Agregar semestre">
          <Plus size={16} />
        </Button>
      </div>
    </Card>
  )
}
