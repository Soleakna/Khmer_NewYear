CREATE TABLE entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  owner uuid NOT NULL REFERENCES auth.users (id),
  title text NOT NULL,
  slug text,
  description text,
  image text,
  contributor text,
  place text
);