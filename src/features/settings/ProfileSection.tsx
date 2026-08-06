import { useEffect, useRef, useState } from 'react'
import { UserRound } from 'lucide-react'
import { useAuth } from '@/app/providers/AuthProvider'
import { supabase } from '@/services/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FieldGroup, Input, Label } from '@/components/ui/Field'

export function ProfileSection() {
  const { profile, user, isLocalMode, refreshProfile, signOut } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '')
  const [career, setCareer] = useState(profile?.career ?? '')
  const [institution, setInstitution] = useState(profile?.institution ?? '')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDisplayName(profile?.displayName ?? '')
    setCareer(profile?.career ?? '')
    setInstitution(profile?.institution ?? '')
  }, [profile])

  useEffect(() => {
    if (!supabase || !profile?.avatarPath) return
    supabase.storage
      .from('avatars')
      .createSignedUrl(profile.avatarPath, 3600)
      .then(({ data }) => setAvatarUrl(data?.signedUrl ?? null))
  }, [profile?.avatarPath])

  if (isLocalMode) {
    return (
      <Card>
        <h3 className="font-medium text-ink">Perfil de estudiante</h3>
        <p className="mt-1 text-sm text-muted">
          Se activa cuando conectás un proyecto de Supabase y creás tu cuenta (ver README).
        </p>
      </Card>
    )
  }

  async function handleSave() {
    if (!supabase || !user) return
    setSaving(true)
    try {
      await supabase
        .from('profiles')
        .update({ display_name: displayName, career, institution })
        .eq('id', user.id)
      await refreshProfile()
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarChange(file: File | null) {
    if (!file || !supabase || !user) return
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${user.id}/avatar.${ext}`
    await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    await supabase.from('profiles').update({ avatar_path: path }).eq('id', user.id)
    await refreshProfile()
  }

  return (
    <Card>
      <h3 className="font-medium text-ink">Perfil de estudiante</h3>

      <div className="mt-3 flex items-center gap-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-soft text-accent-ink"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Foto de perfil" className="h-full w-full object-cover" />
          ) : (
            <UserRound size={26} />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void handleAvatarChange(e.target.files?.[0] ?? null)}
        />
        <div className="text-sm">
          <p className="text-ink">{user?.email}</p>
          <button onClick={() => fileInputRef.current?.click()} className="text-accent underline">
            Cambiar foto
          </button>
        </div>
      </div>

      <FieldGroup>
        <Label>Nombre</Label>
        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </FieldGroup>
      <FieldGroup>
        <Label>Carrera</Label>
        <Input value={career} onChange={(e) => setCareer(e.target.value)} placeholder="Ingeniería, Diseño…" />
      </FieldGroup>
      <FieldGroup>
        <Label>Institución</Label>
        <Input value={institution} onChange={(e) => setInstitution(e.target.value)} />
      </FieldGroup>

      <div className="flex gap-2">
        <Button onClick={() => void handleSave()} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar perfil'}
        </Button>
        <Button variant="ghost" onClick={() => void signOut()}>
          Cerrar sesión
        </Button>
      </div>
    </Card>
  )
}
