-- Executar UMA VEZ no SQL Editor do projeto Supabase CCCO.
-- O bucket é público para permitir mostrar cartazes no website.
-- Apenas administradores autenticados podem carregar, substituir ou eliminar imagens.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-images', 'event-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = excluded.public,
 file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "ccco_public_event_images" on storage.objects;
create policy "ccco_public_event_images" on storage.objects
for select to anon, authenticated using (bucket_id = 'event-images');

drop policy if exists "ccco_admin_upload_images" on storage.objects;
create policy "ccco_admin_upload_images" on storage.objects
for insert to authenticated with check (bucket_id = 'event-images' and public.is_ccco_admin());

drop policy if exists "ccco_admin_update_images" on storage.objects;
create policy "ccco_admin_update_images" on storage.objects
for update to authenticated using (bucket_id = 'event-images' and public.is_ccco_admin())
with check (bucket_id = 'event-images' and public.is_ccco_admin());

drop policy if exists "ccco_admin_delete_images" on storage.objects;
create policy "ccco_admin_delete_images" on storage.objects
for delete to authenticated using (bucket_id = 'event-images' and public.is_ccco_admin());
