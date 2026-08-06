-- Cuentas, perfil de estudiante y panel de administración.
-- Estudiario sigue siendo de uso personal (no hay funciones sociales entre
-- cuentas), pero cada persona que instala la app crea su propia cuenta con
-- mail + contraseña, y una sola dirección administra el panel de soporte.

-- Cambiar acá si el mail de administración cambia alguna vez.
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select email from auth.users where id = auth.uid()) = 'miasilvestrini@gmail.com',
    false
  )
$$;

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default '',
  avatar_path text, -- path dentro del bucket privado "avatars"
  career text not null default '', -- carrera que estudia
  institution text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on profiles
  for each row execute function set_updated_at();

alter table profiles enable row level security;

create policy "profiles_self_select" on profiles
  for select using (auth.uid() = id or is_admin());

create policy "profiles_self_update" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- El propio usuario no puede insertar su fila directamente: la crea el
-- trigger de abajo apenas se registra, para asegurar que id/email coincidan
-- siempre con auth.users.
create policy "profiles_self_insert" on profiles
  for insert with check (auth.uid() = id);

-- Crea automáticamente la fila de perfil cuando alguien se registra.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Estadísticas para el panel de administración: cuántas materias, eventos y
-- mensajes cargó cada cuenta, y si ya verificó el mail. Es una función
-- security definer (no una vista) para no depender de RLS de auth.users y
-- para poder cortar en seco si quien llama no es admin.
create or replace function admin_get_user_stats()
returns table (
  user_id uuid,
  email text,
  display_name text,
  career text,
  joined_at timestamptz,
  email_confirmed boolean,
  last_sign_in_at timestamptz,
  subject_count bigint,
  event_count bigint,
  chat_message_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'No autorizado';
  end if;

  return query
  select
    p.id,
    p.email,
    p.display_name,
    p.career,
    u.created_at,
    u.email_confirmed_at is not null,
    u.last_sign_in_at,
    (select count(*) from subjects s where s.user_id = p.id and s.deleted_at is null),
    (select count(*) from events e where e.user_id = p.id and e.deleted_at is null),
    (select count(*) from chat_messages m where m.user_id = p.id and m.deleted_at is null)
  from profiles p
  join auth.users u on u.id = p.id
  order by u.created_at desc;
end;
$$;

-- Bucket privado para fotos de perfil.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do nothing;

create policy "avatars_owner_select"
  on storage.objects for select
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_owner_write"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_owner_update"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_owner_delete"
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
