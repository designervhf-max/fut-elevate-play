-- Add RLS policy to allow game creators to remove participants from their games
CREATE POLICY "Creators can remove participants from their games"
ON public.game_participants
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.games 
    WHERE games.id = game_participants.game_id 
    AND games.creator_id = auth.uid()
  )
);