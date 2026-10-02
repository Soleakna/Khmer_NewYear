-- /contribute: add the photo column and create the photos storage bucket.
--
-- The contribution form stores only existing entries columns: title, slug,
-- description, contributor, place, and photo. province/source are NOT part of
-- the archive's schema and are intentionally not added. The existing `image`
-- column is left untouched — old entries keep displaying through it — while
-- the new `photo` column holds the Supabase Storage public URL for newly
-- uploaded photos.
--
-- photo stays nullable on purpose: the existing rows predate it, and a NOT
-- NULL column would break reads/updates of those old rows. Required-ness is
-- enforced by the form (layer 1) and by the storage file restrictions and RLS
-- policies below (layers 2-3).

ALTER TABLE entries
  ADD COLUMN IF NOT EXISTS photo text;

-- The photos bucket is public because the archive is fully public: entry
-- pages are statically rendered with ordinary <img> tags, so the photo must
-- be reachable through a public URL with no viewer session.
--
-- The 5 MB size limit and the JPG/PNG/WebP allow-list are enforced BY THE
-- BUCKET (Supabase Storage is the final enforcement layer for uploads), so
-- they hold even when the browser-side form checks are bypassed.
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

UPDATE storage.buckets
SET file_size_limit = 5242880, -- 5 megabytes
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'photos';

-- Entries RLS: the public SELECT policy already exists
-- (20260926120000_allow_public_read_entries.sql). The contribution flow also
-- needs INSERT: a signed-in user may insert a row only when they own it.
-- owner must equal auth.uid(), so owner always comes from the session.
GRANT INSERT ON entries TO authenticated;

DROP POLICY IF EXISTS "Users can insert their own entries" ON entries;
CREATE POLICY "Users can insert their own entries"
  ON entries
  FOR INSERT
  WITH CHECK (auth.uid() = owner);

-- Storage RLS for the photos bucket.
-- Anyone may READ photos (they are shown on public archive pages).
DROP POLICY IF EXISTS "Public read access to photos" ON storage.objects;
CREATE POLICY "Public read access to photos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'photos');

-- Only signed-in users may UPLOAD into the bucket.
DROP POLICY IF EXISTS "Authenticated users can upload to photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload to photos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'photos' AND auth.role() = 'authenticated');

-- A user may DELETE only files under their own folder (<user id>/...). Used
-- to clean up a photo whose entry insert failed, so nobody else's files can
-- be touched.
DROP POLICY IF EXISTS "Owners can delete their photos" ON storage.objects;
CREATE POLICY "Owners can delete their photos"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );