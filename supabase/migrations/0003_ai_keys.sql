-- Guardado seguro de la clave de IA (BYOK) usando Supabase Vault.
-- La clave en texto plano viaja una sola vez, por HTTPS, desde el cliente
-- autenticado hacia esta función — nunca se guarda en una tabla común ni
-- se vuelve a exponer al frontend. Solo se guarda el id del secreto.

create extension if not exists supabase_vault;

alter table ai_provider_settings
  add column if not exists has_key_configured boolean not null default false;

create or replace function save_ai_key(p_provider text, p_model text, p_api_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret_id uuid;
  v_existing uuid;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  select encrypted_key_id into v_existing
  from ai_provider_settings
  where user_id = auth.uid();

  if v_existing is not null then
    perform vault.update_secret(v_existing, p_api_key);
    v_secret_id := v_existing;
  else
    v_secret_id := vault.create_secret(
      p_api_key,
      'ai_key_' || auth.uid()::text,
      'Clave de IA (BYOK) del usuario'
    );
  end if;

  insert into ai_provider_settings (user_id, provider, model, encrypted_key_id, has_key_configured)
  values (auth.uid(), p_provider, p_model, v_secret_id, true)
  on conflict (user_id) do update
    set provider = excluded.provider,
        model = excluded.model,
        encrypted_key_id = excluded.encrypted_key_id,
        has_key_configured = true;
end;
$$;

create or replace function clear_ai_key()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing uuid;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  select encrypted_key_id into v_existing
  from ai_provider_settings
  where user_id = auth.uid();

  if v_existing is not null then
    delete from vault.secrets where id = v_existing;
  end if;

  update ai_provider_settings
  set encrypted_key_id = null, has_key_configured = false, provider = 'ninguno'
  where user_id = auth.uid();
end;
$$;

grant execute on function save_ai_key(text, text, text) to authenticated;
grant execute on function clear_ai_key() to authenticated;
