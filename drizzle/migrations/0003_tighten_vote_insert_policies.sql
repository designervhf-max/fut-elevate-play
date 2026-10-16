DROP POLICY IF EXISTS "Confirmed participants can vote mvp" ON public.match_mvp_votes;
CREATE POLICY "Confirmed participants can vote mvp" ON public.match_mvp_votes
FOR INSERT TO authenticated
WITH CHECK (
  voter_id = auth.uid()
  AND voted_for_id <> voter_id
  AND EXISTS (
    SELECT 1 FROM public.match_participants mp
    WHERE mp.match_id = match_mvp_votes.match_id
      AND mp.user_id = auth.uid()
      AND mp.status = 'Confirmado'::participant_status
  )
  AND EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_mvp_votes.match_id
      AND m.status IN ('encerrada'::match_status, 'finished'::match_status)
  )
  AND EXISTS (
    SELECT 1 FROM public.match_participants mp2
    WHERE mp2.match_id = match_mvp_votes.match_id
      AND mp2.user_id = match_mvp_votes.voted_for_id
      AND mp2.status = 'Confirmado'::participant_status
  )
);

DROP POLICY IF EXISTS "Confirmed participants can vote defender" ON public.match_defender_votes;
CREATE POLICY "Confirmed participants can vote defender" ON public.match_defender_votes
FOR INSERT TO authenticated
WITH CHECK (
  voter_id = auth.uid()
  AND voted_for_id <> voter_id
  AND EXISTS (
    SELECT 1 FROM public.match_participants mp
    WHERE mp.match_id = match_defender_votes.match_id
      AND mp.user_id = auth.uid()
      AND mp.status = 'Confirmado'::participant_status
  )
  AND EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_defender_votes.match_id
      AND m.status IN ('encerrada'::match_status, 'finished'::match_status)
  )
  AND EXISTS (
    SELECT 1 FROM public.match_participants mp2
    WHERE mp2.match_id = match_defender_votes.match_id
      AND mp2.user_id = match_defender_votes.voted_for_id
      AND mp2.status = 'Confirmado'::participant_status
  )
);