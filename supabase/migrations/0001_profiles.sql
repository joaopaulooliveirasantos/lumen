-- Tabela de perfil publico, complementando auth.users (gerenciada pelo Supabase Auth).
-- Rode este arquivo no SQL Editor do projeto Supabase (Authentication + Database).

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Usuarios leem o proprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuarios atualizam o proprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- Cria automaticamente uma linha em profiles quando um usuario se cadastra
-- (email/senha ou login social). O nome vem do metadata informado no cadastro
-- (signUp com data.display_name) ou do provider social (Google/Apple mandam
-- full_name/name em raw_user_meta_data).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
