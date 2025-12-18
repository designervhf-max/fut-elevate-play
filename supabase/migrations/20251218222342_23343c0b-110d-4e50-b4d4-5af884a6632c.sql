-- Add columns for guest/random players in game_participants
ALTER TABLE public.game_participants 
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.game_participants 
  ADD COLUMN guest_name text,
  ADD COLUMN guest_position text;

-- Add check constraint: either user_id or guest_name must be provided
ALTER TABLE public.game_participants
  ADD CONSTRAINT participant_identity_check 
  CHECK (user_id IS NOT NULL OR guest_name IS NOT NULL);

-- Update RLS policy to allow organizers to add guest players
CREATE POLICY "Creators can add guest players"
ON public.game_participants
FOR INSERT
WITH CHECK (
  guest_name IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM games 
    WHERE games.id = game_participants.game_id 
    AND games.creator_id = auth.uid()
  )
);