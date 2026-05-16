DROP POLICY IF EXISTS "Users can update own status" ON public.match_participants;
DROP POLICY IF EXISTS "Confirmed participants can submit own stats when match ended" ON public.match_participants;

CREATE OR REPLACE FUNCTION public.can_submit_own_match_stats(_participant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.match_participants mp
    JOIN public.matches m ON m.id = mp.match_id
    WHERE mp.id = _participant_id
      AND mp.user_id = auth.uid()
      AND mp.status = 'Confirmado'::participant_status
      AND m.status = 'encerrada'::match_status
  )
$$;

CREATE OR REPLACE FUNCTION public.can_update_own_match_status(_participant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.match_participants mp
    WHERE mp.id = _participant_id
      AND mp.user_id = auth.uid()
  )
$$;

CREATE POLICY "Users can update own status"
ON public.match_participants
FOR UPDATE
TO authenticated
USING (public.can_update_own_match_status(id))
WITH CHECK (
  public.can_update_own_match_status(id)
  AND goals IS NOT DISTINCT FROM (SELECT public.match_participants.goals)
  AND assists IS NOT DISTINCT FROM (SELECT public.match_participants.assists)
  AND saves IS NOT DISTINCT FROM (SELECT public.match_participants.saves)
  AND rating IS NOT DISTINCT FROM (SELECT public.match_participants.rating)
  AND paid IS NOT DISTINCT FROM (SELECT public.match_participants.paid)
  AND stats_submitted IS NOT DISTINCT FROM (SELECT public.match_participants.stats_submitted)
  AND team IS NOT DISTINCT FROM (SELECT public.match_participants.team)
);

CREATE POLICY "Confirmed participants can submit own stats when match ended"
ON public.match_participants
FOR UPDATE
TO authenticated
USING (public.can_submit_own_match_stats(id))
WITH CHECK (
  public.can_submit_own_match_stats(id)
  AND paid IS NOT DISTINCT FROM (SELECT public.match_participants.paid)
  AND team IS NOT DISTINCT FROM (SELECT public.match_participants.team)
  AND status IS NOT DISTINCT FROM (SELECT public.match_participants.status)
  AND match_id IS NOT DISTINCT FROM (SELECT public.match_participants.match_id)
  AND user_id IS NOT DISTINCT FROM (SELECT public.match_participants.user_id)
  AND guest_name IS NOT DISTINCT FROM (SELECT public.match_participants.guest_name)
  AND guest_position IS NOT DISTINCT FROM (SELECT public.match_participants.guest_position)
  AND confirmed_via_link IS NOT DISTINCT FROM (SELECT public.match_participants.confirmed_via_link)
);