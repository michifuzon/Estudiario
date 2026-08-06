-- Acceso a la clave de IA desencriptada, exclusivo para la Edge Function
-- (que se conecta con el rol service_role, nunca con la sesión del
-- navegador). Un usuario autenticado común NO puede llamar a esta función:
-- por eso el archivo de la función de análisis de fotos puede leer la
-- clave server-side sin que el frontend la vea nunca.
create or replace function get_decrypted_ai_key(p_user_id uuid)
returns table(provider text, model text, api_key text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select s.provider, s.model, v.decrypted_secret
  from ai_provider_settings s
  join vault.decrypted_secrets v on v.id = s.encrypted_key_id
  where s.user_id = p_user_id;
end;
$$;

revoke all on function get_decrypted_ai_key(uuid) from public, authenticated, anon;
grant execute on function get_decrypted_ai_key(uuid) to service_role;
