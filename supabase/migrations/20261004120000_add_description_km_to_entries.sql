-- Khmer description for each entry (bilingual detail page).
--
-- The English `description` column is untouched. `description_km` is nullable
-- and optional: existing rows keep NULL and show only the English text.
-- No RLS policy or grant changes are needed: the existing public SELECT policy
-- and the owner INSERT/UPDATE policies already cover every column of a row.
-- Safe to run more than once.

ALTER TABLE entries
  ADD COLUMN IF NOT EXISTS description_km text;
