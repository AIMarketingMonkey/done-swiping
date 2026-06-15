-- Add new columns to structured_profiles for multi-session accumulation and inclusivity

ALTER TABLE public.structured_profiles
  ADD COLUMN IF NOT EXISTS relationship_structure TEXT,
  ADD COLUMN IF NOT EXISTS partner_awareness TEXT,
  ADD COLUMN IF NOT EXISTS love_languages TEXT[];
