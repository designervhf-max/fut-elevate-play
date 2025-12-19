-- Add open_for_confirmation to matches table
-- When false, users cannot confirm presence yet (admin needs to "release" the match)
ALTER TABLE public.matches
ADD COLUMN open_for_confirmation boolean NOT NULL DEFAULT false;

-- Add a comment for clarity
COMMENT ON COLUMN public.matches.open_for_confirmation IS 'When true, members can confirm their presence for this match';