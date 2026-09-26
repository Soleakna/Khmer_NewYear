-- Guarantee the public/anonymous user can always READ the entries table.
--
-- The archive is intentionally fully public: anyone may browse and search
-- even when logged out, and the build script pre-renders /entries/[slug]
-- pages from the same table. The earlier migrations never touched RLS, so
-- this file makes the situation explicit and safe either way:
--   * if RLS is currently OFF  -> enabling it would otherwise hide every
--     row, so the SELECT policy below keeps all rows visible to everyone;
--   * if RLS is currently ON   -> the policy unblocks anonymous reads again.
-- It is safe to run more than once.

ALTER TABLE entries
  ENABLE ROW LEVEL SECURITY;

-- Fresh Supabase projects grant table-level privileges by default, but be
-- explicit so a project that revoked them still lets a logged-out visitor
-- read the archive.
GRANT SELECT ON entries TO anon, authenticated;

-- Allow anyone (logged in or not) to select every row. DROP first keeps this
-- migration re-runnable if you already applied it once.
DROP POLICY IF EXISTS "Entries are publicly readable" ON entries;
CREATE POLICY "Entries are publicly readable"
  ON entries
  FOR SELECT
  USING (true);