-- Sprint 3 review fix: every new entry must start as 'pending'.
--
-- The previous INSERT policy only checked ownership (auth.uid() = owner), so
-- a crafted request could insert a row with status = 'published' and bypass
-- the review step. This migration makes the 'pending' requirement a rule of
-- the database, not a client-side convention:
--
--   1. ensure the status column exists with the 'pending' default the app
--      already relies on (no-op if your project already has it);
--   2. backfill any legacy NULL statuses so the CHECK below can be added;
--   3. allow only the three review statuses: pending, published, returned;
--   4. tighten INSERT: a signed-in user may insert a row only when they own
--      it AND it is 'pending'.
--
-- RLS stays enabled throughout. All statements are safe to run more than once.

ALTER TABLE entries
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- The app inserts entries without sending `status`; make sure the column
-- default always produces 'pending' on such inserts (idempotent no-op if the
-- default is already set).
ALTER TABLE entries
  ALTER COLUMN status SET DEFAULT 'pending';

UPDATE entries
SET status = 'pending'
WHERE status IS NULL;

ALTER TABLE entries
  DROP CONSTRAINT IF EXISTS entries_status_check;
ALTER TABLE entries
  ADD CONSTRAINT entries_status_check CHECK (status IN ('pending', 'published', 'returned'));

DROP POLICY IF EXISTS "Users can insert their own entries" ON entries;
CREATE POLICY "Users can insert their own entries"
  ON entries
  FOR INSERT
  WITH CHECK (auth.uid() = owner AND status = 'pending');