ALTER TABLE entries
  ADD COLUMN place text;

UPDATE entries
SET place = 'Kbal Trach village, Kratie province'
WHERE place IS NULL;

-- Remove duplicate rows (same slug inserted more than once),
-- keeping the oldest copy per slug.
DELETE FROM entries
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at, id) AS rn
    FROM entries
  ) ranked
  WHERE rn > 1
);

-- Prevent future duplicate slugs from getting inserted again.
-- Must run after the dedupe above, since Postgres refuses to
-- create a UNIQUE constraint while duplicates exist.
ALTER TABLE entries
  ADD CONSTRAINT entries_slug_unique UNIQUE (slug);