CREATE POLICY "Confirmed participants can submit own stats when match ended"
ON public.match_participants
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND status = 'Confirmado'::participant_status
  AND EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_participants.match_id
      AND m.status = 'encerrada'::match_status
  )
)
WITH CHECK (
  user_id = auth.uid()
  AND status = 'Confirmado'::participant_status
  AND EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_participants.match_id
      AND m.status = 'encerrada'::match_status
  )
);