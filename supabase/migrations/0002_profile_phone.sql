-- Login obrigatório (doc/planejamento-login-obrigatorio.md): telefone, aceite dos termos e marca de
-- cadastro completo no perfil. Rode no SQL Editor do projeto Supabase, depois do 0001.
-- Idempotente: pode ser executado mais de uma vez.

alter table public.profiles
  add column if not exists phone text,
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists profile_completed_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

-- Telefone em E.164 (ex.: +5511999999999). Sem unicidade (decisão 4) e sem verificação por SMS (decisão 2).
alter table public.profiles drop constraint if exists profiles_phone_e164;
alter table public.profiles
  add constraint profiles_phone_e164 check (phone is null or phone ~ '^\+[1-9][0-9]{7,14}$');

-- Contas antigas podem não ter linha em profiles (criadas antes do 0001): o app faz upsert na tela
-- "Completar cadastro", então o usuário precisa poder inserir a própria linha.
drop policy if exists "Usuarios inserem o proprio perfil" on public.profiles;
create policy "Usuarios inserem o proprio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- A policy de update do 0001 não tinha WITH CHECK; sem ele, um usuário poderia trocar o próprio id.
drop policy if exists "Usuarios atualizam o proprio perfil" on public.profiles;
create policy "Usuarios atualizam o proprio perfil"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.touch_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_profiles_updated_at();

-- O cadastro por e-mail envia nome, telefone e aceite dos termos no metadata (signUp options.data).
-- O login pelo Google não traz telefone: o perfil nasce incompleto e o app mostra "Completar cadastro".
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_phone text := meta ->> 'phone';
  v_terms timestamptz := nullif(meta ->> 'terms_accepted_at', '')::timestamptz;
  v_name text := coalesce(meta ->> 'display_name', meta ->> 'full_name', meta ->> 'name');
begin
  if v_phone is not null and v_phone !~ '^\+[1-9][0-9]{7,14}$' then
    v_phone := null;
  end if;

  insert into public.profiles (id, display_name, avatar_url, phone, terms_accepted_at, profile_completed_at)
  values (
    new.id,
    v_name,
    meta ->> 'avatar_url',
    v_phone,
    v_terms,
    case when v_phone is not null and v_terms is not null and v_name is not null then now() end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
