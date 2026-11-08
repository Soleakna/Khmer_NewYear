

BEGIN;

DO $$
BEGIN
  IF to_regprocedure('public.is_reviewer()') IS NULL THEN
    RAISE EXCEPTION 'public.is_reviewer() not found. Aborting migration.';
  END IF;
END
$$;


DROP POLICY IF EXISTS "Entries are publicly readable" ON entries;
DROP POLICY IF EXISTS "anyone can read published entries" ON entries;
DROP POLICY IF EXISTS "Anyone can read published entries" ON entries;
DROP POLICY IF EXISTS "owners can read their own entries" ON entries;
DROP POLICY IF EXISTS "reviewers can read all entries" ON entries;

-- Visitors, signed in or not: published entries only. This policy never calls
-- is_reviewer(), so the anon role does not need EXECUTE on it.
CREATE POLICY "anyone can read published entries"
  ON entries FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- Contributors: their own entries in every status (pending, returned, published).
CREATE POLICY "owners can read their own entries"
  ON entries FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = owner);

-- Reviewers: every entry, for the review queue.
CREATE POLICY "reviewers can read all entries"
  ON entries FOR SELECT
  TO authenticated
  USING ((SELECT public.is_reviewer()));


DROP POLICY IF EXISTS "Users can update their own entries" ON entries;
DROP POLICY IF EXISTS "Owners can update their own entries" ON entries;
DROP POLICY IF EXISTS "owners edit their own entries" ON entries;

-- Every owner edit must leave the row 'pending', including a reviewer's own
-- entry. Owners can never publish or return an entry through any route.
CREATE POLICY "owners edit their own entries"
  ON entries FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = owner)
  WITH CHECK ((SELECT auth.uid()) = owner AND status = 'pending');


DROP POLICY IF EXISTS "reviewers review entries" ON entries;

-- Reviewers may act on any row, and may set status only to 'published' or
-- 'returned'. Other columns are protected by entries_guard_update below.
CREATE POLICY "reviewers review entries"
  ON entries FOR UPDATE
  TO authenticated
  USING ((SELECT public.is_reviewer()))
  WITH CHECK (
    (SELECT public.is_reviewer())
    AND status IN ('published', 'returned')
  );



-- RLS cannot restrict which columns change, and permissive policies combine
-- with OR. A reviewer who owns an entry matches the reviewer policy AND the
-- owner policy, so this trigger is the final gate. It enforces:
--   * no signed-in user: only postgres or service_role may change entries
--   * the owner (contributor or reviewer): any edit must leave status 'pending',
--     and owner cannot be changed
--   * a reviewer who does not own the row: may change status only, to
--     'published' or 'returned'
CREATE OR REPLACE FUNCTION public.entries_guard_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  caller uuid := auth.uid();
  content_changed boolean;
BEGIN
  -- No signed-in user: only the dashboard (postgres) and server tools
  -- (service_role) may change entries.
  IF caller IS NULL THEN
    IF current_user IN ('postgres', 'service_role') THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Anonymous updates to entries are not allowed';
  END IF;

  -- True when anything other than status changed (title, owner, photo, ...).
  content_changed :=
    (to_jsonb(NEW) - 'status') IS DISTINCT FROM (to_jsonb(OLD) - 'status');

  -- Owner branch. This applies to contributors AND reviewers who own the row.
  -- Being a reviewer gives no right to publish or return your own entry.
  IF caller = OLD.owner THEN
    IF NEW.owner IS DISTINCT FROM OLD.owner THEN
      RAISE EXCEPTION 'The owner of an entry cannot be changed';
    END IF;
    -- Applies to reviewers too: a reviewer's own entry must go through another
    -- reviewer. Any edit by the owner sends the entry back to 'pending'.
    IF NEW.status IS DISTINCT FROM 'pending' THEN
      RAISE EXCEPTION 'You cannot publish or return your own entry. Another reviewer must do it';
    END IF;
    RETURN NEW;
  END IF;

  -- Non-owner branch: only reviewers may change someone else's entry.
  IF NOT public.is_reviewer() THEN
    RAISE EXCEPTION 'Only the owner or a reviewer can change this entry';
  END IF;

  -- Reviewers must not edit another user's content.
  IF content_changed THEN
    RAISE EXCEPTION 'Reviewers may only change the status of entries they do not own';
  END IF;

  -- Reviewers may only publish or return.
  IF NEW.status NOT IN ('published', 'returned') THEN
    RAISE EXCEPTION 'Reviewers may only set status to published or returned';
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger functions are only fired by the database, never called by clients.
REVOKE EXECUTE ON FUNCTION public.entries_guard_update() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS entries_guard_update ON entries;
CREATE TRIGGER entries_guard_update
  BEFORE UPDATE ON entries
  FOR EACH ROW
  EXECUTE FUNCTION public.entries_guard_update();

-- is_reviewer(): signed-in users only. The app and the policies call it as
-- authenticated.
REVOKE EXECUTE ON FUNCTION public.is_reviewer() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_reviewer() TO authenticated;

-- reviewers: no client writes and no anonymous reads.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.reviewers FROM anon, authenticated;
REVOKE SELECT ON public.reviewers FROM anon;

-- entries: anon is read-only; no client role may TRUNCATE, REFERENCES, or TRIGGER.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.entries FROM anon;
REVOKE TRUNCATE, REFERENCES, TRIGGER
  ON public.entries FROM authenticated;

COMMIT;
