DROP POLICY IF EXISTS "Users can update own status" ON public.match_participants;
DROP POLICY IF EXISTS "Confirmed participants can submit own stats when match ended" ON public.match_participants;

CREATE OR REPLACE FUNCTION public.can_update_own_match_status_only(
  _participant_id uuid,
  _match_id uuid,
  _user_id uuid,
  _guest_name text,
  _guest_position text,
  _goals integer,
  _assists integer,
  _saves integer,
  _rating numeric,
  _paid boolean,
  _stats_submitted boolean,
  _team integer,
  _confirmed_via_link boolean
)
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
      AND _user_id = mp.user_id
      AND _match_id = mp.match_id
      AND _guest_name IS NOT DISTINCT FROM mp.guest_name
      AND _guest_position IS NOT DISTINCT FROM mp.guest_position
      AND _goals IS NOT DISTINCT FROM mp.goals
      AND _assists IS NOT DISTINCT FROM mp.assists
      AND _saves IS NOT DISTINCT FROM mp.saves
      AND _rating IS NOT DISTINCT FROM mp.rating
      AND _paid IS NOT DISTINCT FROM mp.paid
      AND _stats_submitted IS NOT DISTINCT FROM mp.stats_submitted
      AND _team IS NOT DISTINCT FROM mp.team
      AND _confirmed_via_link IS NOT DISTINCT FROM mp.confirmed_via_link
  )
$$;

CREATE OR REPLACE FUNCTION public.can_submit_own_match_stats_update(
  _participant_id uuid,
  _match_id uuid,
  _user_id uuid,
  _status participant_status,
  _guest_name text,
  _guest_position text,
  _paid boolean,
  _team integer,
  _confirmed_via_link boolean
)
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
      AND mp.user_id = _user_id
      AND mp.status = 'Confirmado'::participant_status
      AND m.status = 'encerrada'::match_status
      AND _match_id = mp.match_id
      AND _status = mp.status
      AND _guest_name IS NOT DISTINCT FROM mp.guest_name
      AND _guest_position IS NOT DISTINCT FROM mp.guest_position
      AND _paid IS NOT DISTINCT FROM mp.paid
      AND _team IS NOT DISTINCT FROM mp.team
      AND _confirmed_via_link IS NOT DISTINCT FROM mp.confirmed_via_link
  )
$$;

REVOKE ALL ON FUNCTION public.can_update_own_match_status_only(uuid, uuid, uuid, text, text, integer, integer, integer, numeric, boolean, boolean, integer, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_submit_own_match_stats_update(uuid, uuid, uuid, participant_status, text, text, boolean, integer, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_update_own_match_status_only(uuid, uuid, uuid, text, text, integer, integer, integer, numeric, boolean, boolean, integer, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_submit_own_match_stats_update(uuid, uuid, uuid, participant_status, text, text, boolean, integer, boolean) TO authenticated;

CREATE POLICY "Users can update own status"
ON public.match_participants
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  public.can_update_own_match_status_only(
    id,
    match_id,
    user_id,
    guest_name,
    guest_position,
    goals,
    assists,
    saves,
    rating,
    paid,
    stats_submitted,
    team,
    confirmed_via_link
  )
);

CREATE POLICY "Confirmed participants can submit own stats when match ended"
ON public.match_participants
FOR UPDATE
TO authenticated
USING (public.can_submit_own_match_stats(id))
WITH CHECK (
  public.can_submit_own_match_stats_update(
    id,
    match_id,
    user_id,
    status,
    guest_name,
    guest_position,
    paid,
    team,
    confirmed_via_link
  )
);