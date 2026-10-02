-- Owner-only UPDATE and DELETE policies for the entries table (Sprint 2:
-- edit & delete your own entries).
--
-- The Edit / Delete buttons on an entry page are only SHOWN to the owner,
-- but that is UI convenience, not security. THESE policies are the real
-- boundary: a signed-in user may UPDATE or DELETE a row only when they own
-- it (auth.uid() = owner). Row Level Security denies by default, so without
-- them every update and delete would silently affect zero rows and the
-- edit/delete flows could never work.
--
-- The UPDATE policy's WITH CHECK clause also guarantees that even a
-- malformed client request can never re-assign a row to another owner.

GRANT UPDATE, DELETE ON entries TO authenticated;

DROP POLICY IF EXISTS "Users can update their own entries" ON entries;
CREATE POLICY "Users can update their own entries"
  ON entries
  FOR UPDATE
  USING (auth.uid() = owner)
  WITH CHECK (auth.uid() = owner);

DROP POLICY IF EXISTS "Users can delete their own entries" ON entries;
CREATE POLICY "Users can delete their own entries"
  ON entries
  FOR DELETE
  USING (auth.uid() = owner);