-- ============================================================================
-- 0006: Storage-Bucket "avatars" for user profile pictures.
-- Path convention: {userId}/avatar.{ext}  (upsert = true on re-upload)
-- Bucket is public — avatar images are served via CDN without auth tokens.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

-- Drop existing policies first to make migration idempotent.
drop policy if exists "avatars_public_read"    on storage.objects;
drop policy if exists "avatars_owner_insert"   on storage.objects;
drop policy if exists "avatars_owner_update"   on storage.objects;
drop policy if exists "avatars_owner_delete"   on storage.objects;

-- SELECT: unrestricted — any visitor (including unauthenticated) can load avatars.
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- INSERT: only if the first path segment matches the authenticated user's ID.
-- Path: {userId}/avatar.{ext} → foldername(name)[1] = userId
create policy "avatars_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- UPDATE: same folder-ownership check in both USING and WITH CHECK clauses.
create policy "avatars_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- DELETE: only the owning user may remove their own avatar.
create policy "avatars_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- RLS Policy verification guide (run manually against your Supabase project)
-- ============================================================================
--
-- 1. SELECT — unauthenticated visitor can read:
--    curl "<SUPABASE_URL>/storage/v1/object/public/avatars/<userId>/avatar.jpg"
--    Expected: 200 OK (image bytes returned)
--
-- 2. INSERT — owner can upload:
--    POST /storage/v1/object/avatars/<userId>/avatar.jpg  (with user's JWT)
--    Expected: 200 OK
--
-- 3. INSERT — other user cannot upload to a different folder:
--    POST /storage/v1/object/avatars/<otherUserId>/avatar.jpg  (with user's JWT)
--    Expected: 400 / 403 (RLS violation)
--
-- 4. DELETE — owner can delete own avatar:
--    DELETE /storage/v1/object/avatars/<userId>/avatar.jpg  (with user's JWT)
--    Expected: 200 OK
--
-- 5. DELETE — other user cannot delete another user's avatar:
--    DELETE /storage/v1/object/avatars/<otherUserId>/avatar.jpg  (with user's JWT)
--    Expected: 400 / 403 (RLS violation)
