-- Estudiario — esquema inicial (Etapa 1)
-- Espeja el modelo de src/types/domain.ts. Cada tabla pertenece a un único
-- usuario (auth.uid()) y usa Row Level Security para que nadie más pueda
-- leer o escribir esos datos, ni siquiera con la clave "anon" pública.

create extension if not exists "pgcrypto";

-- Función helper: todas las tablas comparten user_id + timestamps + soft delete.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table semesters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  start_date date,
  end_date date,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  semester_id uuid not null references semesters(id) on delete cascade,
  name text not null,
  professor text not null default '',
  schedule text not null default '',
  location text not null default '',
  color text not null default '#3c4577',
  description text not null default '',
  difficulty smallint not null default 2 check (difficulty between 1 and 4),
  weekly_hours_target numeric not null default 2,
  status text not null default 'cursando'
    check (status in ('cursando', 'pendiente', 'regularizada', 'aprobada', 'archivada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references subjects(id) on delete cascade,
  type text not null check (type in (
    'parcial', 'final', 'recuperatorio', 'entrega', 'trabajo_practico',
    'presentacion', 'clase', 'inscripcion', 'sin_clases', 'sesion_estudio', 'recordatorio'
  )),
  title text not null,
  date date not null,
  time time,
  topics text not null default '',
  importance smallint not null default 2 check (importance between 1 and 3),
  notes text not null default '',
  status text not null default 'pendiente' check (status in ('pendiente', 'completado', 'cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  event_id uuid references events(id) on delete set null,
  chat_message_id uuid,
  topic text not null,
  objective text not null default '',
  date date not null,
  duration_minutes integer not null default 50,
  priority numeric not null default 0,
  status text not null default 'pendiente'
    check (status in ('pendiente', 'en_curso', 'completada', 'pospuesta')),
  origin text not null default 'auto' check (origin in ('auto', 'manual')),
  reasoning text not null default '',
  actual_minutes integer,
  focus_rating smallint,
  perceived_difficulty smallint,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table grades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  name text not null,
  score numeric,
  max_score numeric not null default 10,
  weight numeric not null default 1,
  date date not null,
  observations text not null default '',
  status text not null default 'pendiente' check (status in ('aprobado', 'desaprobado', 'pendiente')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table availability (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  max_daily_minutes integer not null default 180,
  preferred_session_minutes integer not null default 50,
  break_minutes integer not null default 10,
  time_of_day_preference text not null default 'indistinto',
  weekly_slots jsonb not null default '[]',
  exceptions jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references subjects(id) on delete cascade, -- null = bandeja general
  type text not null check (type in ('texto', 'foto', 'audio', 'archivo', 'enlace')),
  text text not null default '',
  status text not null default 'nuevo' check (status in (
    'nuevo', 'pendiente_revisar', 'revisado', 'importante', 'usado_para_estudiar', 'archivado'
  )),
  pinned boolean not null default false,
  tags text[] not null default '{}',
  reply_to_id uuid references chat_messages(id) on delete set null,
  linked_event_id uuid references events(id) on delete set null,
  linked_session_id uuid references study_sessions(id) on delete set null,
  unit text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table study_sessions
  add constraint study_sessions_chat_message_fk
  foreign key (chat_message_id) references chat_messages(id) on delete set null;

create table attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chat_message_id uuid references chat_messages(id) on delete cascade,
  subject_id uuid references subjects(id) on delete cascade,
  category text not null check (category in (
    'resumen', 'apunte', 'guia_practica', 'trabajo_practico', 'parcial_anterior',
    'material_teorico', 'foto_pizarron', 'archivo', 'enlace', 'nota_rapida'
  )),
  title text not null,
  mime_type text not null default '',
  size_bytes bigint not null default 0,
  storage_path text not null default '', -- path dentro del bucket privado "attachments"
  extracted_text text,
  url text, -- solo para category = 'enlace'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table ai_provider_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  provider text not null default 'ninguno' check (provider in ('ninguno', 'anthropic', 'openai', 'google', 'local')),
  model text not null default '',
  -- la clave nunca se guarda en texto plano ni se expone por la API pública;
  -- se guarda encriptada con Supabase Vault y solo la usan las Edge Functions.
  encrypted_key_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table study_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  onboarding_completed boolean not null default false,
  preferred_session_minutes integer not null default 50,
  anticipation_days integer not null default 7,
  study_method text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at automático
do $$
declare t text;
begin
  foreach t in array array[
    'semesters','subjects','events','study_sessions','grades','availability',
    'chat_messages','attachments','ai_provider_settings','study_profile'
  ]
  loop
    execute format(
      'create trigger set_updated_at before update on %I for each row execute function set_updated_at()',
      t
    );
  end loop;
end $$;

-- índices de consulta frecuente
create index on subjects (user_id, semester_id);
create index on events (user_id, date);
create index on events (subject_id);
create index on study_sessions (user_id, date);
create index on study_sessions (subject_id);
create index on grades (subject_id);
create index on chat_messages (user_id, subject_id, created_at);
create index on attachments (subject_id, category);

-- Row Level Security: cada usuario ve y modifica únicamente sus propios datos.
alter table semesters enable row level security;
alter table subjects enable row level security;
alter table events enable row level security;
alter table study_sessions enable row level security;
alter table grades enable row level security;
alter table availability enable row level security;
alter table chat_messages enable row level security;
alter table attachments enable row level security;
alter table ai_provider_settings enable row level security;
alter table study_profile enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'semesters','subjects','events','study_sessions','grades','availability',
    'chat_messages','attachments','ai_provider_settings','study_profile'
  ]
  loop
    execute format(
      'create policy "%1$s_owner_all" on %1$I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t
    );
  end loop;
end $$;

-- Storage: bucket privado para archivos adjuntos, organizado por
-- attachments/<user_id>/<archivo>. Sin acceso público; solo el dueño.
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

create policy "attachments_owner_select"
  on storage.objects for select
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "attachments_owner_insert"
  on storage.objects for insert
  with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "attachments_owner_delete"
  on storage.objects for delete
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);
