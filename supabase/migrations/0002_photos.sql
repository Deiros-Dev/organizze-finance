-- Fotos das operacoes: coluna de paths + bucket de storage.
-- Modo sem login: mesma politica aberta do restante do app.

alter table public.operations
  add column if not exists photos text[] not null default '{}';

-- Bucket publico (leitura direta por URL, sem passar por RLS).
insert into storage.buckets (id, name, public)
values ('operation-photos', 'operation-photos', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "operation_photos_read" on storage.objects;
create policy "operation_photos_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'operation-photos');

drop policy if exists "operation_photos_insert" on storage.objects;
create policy "operation_photos_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'operation-photos');

drop policy if exists "operation_photos_update" on storage.objects;
create policy "operation_photos_update" on storage.objects
  for update to anon, authenticated
  using (bucket_id = 'operation-photos')
  with check (bucket_id = 'operation-photos');

drop policy if exists "operation_photos_delete" on storage.objects;
create policy "operation_photos_delete" on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'operation-photos');
