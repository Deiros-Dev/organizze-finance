-- Autenticacao por e-mail/senha (Supabase Auth) com banca separada por usuario.
--
-- Reset destrutivo (roda uma unica vez — migrate.mjs mantem um ledger e nao
-- reaplica migracoes ja rodadas): o schema anterior nao tinha nocao de
-- usuario, entao as linhas de operations/aportes/app_settings nao tem dono e
-- nao da pra migrar automaticamente para um usuario especifico.
--
-- Se ha dados que voce quer manter: em Ajustes -> Exportar, salve o backup
-- em JSON ANTES de aplicar esta migracao. Depois de criar sua conta, em
-- Ajustes -> Importar o mesmo JSON volta anexado ao usuario logado (o
-- insert usa a coluna user_id com default auth.uid(), preenchida sozinha).

delete from public.operations;
delete from public.aportes;
delete from public.app_settings;

-- ------------------------------------------------------------------ --
--  operations / aportes: dono da linha                              --
-- ------------------------------------------------------------------ --
alter table public.operations
  add column user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade;
create index if not exists operations_user_id_idx on public.operations (user_id);

alter table public.aportes
  add column user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade;
create index if not exists aportes_user_id_idx on public.aportes (user_id);

-- ------------------------------------------------------------------ --
--  app_settings: de singleton (id fixo = 1) para uma linha por user --
-- ------------------------------------------------------------------ --
alter table public.app_settings drop constraint app_settings_pkey;
alter table public.app_settings add column user_id uuid references auth.users (id) on delete cascade;
alter table public.app_settings drop column id;
alter table public.app_settings alter column user_id set not null;
alter table public.app_settings add primary key (user_id);

-- ------------------------------------------------------------------ --
--  RLS: de "aberto pra anon" para "so o dono, autenticado"           --
-- ------------------------------------------------------------------ --
drop policy if exists "operations_open" on public.operations;
create policy "operations_own" on public.operations
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "aportes_open" on public.aportes;
create policy "aportes_own" on public.aportes
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "app_settings_open" on public.app_settings;
create policy "app_settings_own" on public.app_settings
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------------------------ --
--  Provisiona app_settings automaticamente para todo usuario novo   --
-- ------------------------------------------------------------------ --
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.app_settings (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------------ --
--  Storage: bucket continua publico (leitura direta por URL);       --
--  escrita restrita a propria pasta ("${user.id}/arquivo.ext")       --
-- ------------------------------------------------------------------ --
drop policy if exists "operation_photos_read" on storage.objects;
drop policy if exists "operation_photos_insert" on storage.objects;
drop policy if exists "operation_photos_update" on storage.objects;
drop policy if exists "operation_photos_delete" on storage.objects;

create policy "operation_photos_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'operation-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "operation_photos_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'operation-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "operation_photos_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'operation-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'operation-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "operation_photos_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'operation-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
