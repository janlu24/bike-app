-- ============================================================================
-- 0002: items.image_url + Storage-Bucket "item-images"
-- ============================================================================

alter table public.items
  add column if not exists image_url text;

insert into storage.buckets (id, name, public)
values ('item-images', 'item-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "item_images_public_read"   on storage.objects;
drop policy if exists "item_images_owner_insert"  on storage.objects;
drop policy if exists "item_images_owner_update"  on storage.objects;
drop policy if exists "item_images_owner_delete"  on storage.objects;

create policy "item_images_public_read"
  on storage.objects for select
  using (bucket_id = 'item-images');

-- Pfad-Konvention: <auth.uid>/<timestamp>-<random>.<ext>
create policy "item_images_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'item-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "item_images_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'item-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'item-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "item_images_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'item-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
