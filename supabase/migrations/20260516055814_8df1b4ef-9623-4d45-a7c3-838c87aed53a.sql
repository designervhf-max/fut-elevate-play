DROP FUNCTION IF EXISTS public.can_update_own_match_status(uuid);

REVOKE ALL ON FUNCTION public.can_submit_own_match_stats(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.can_update_own_match_status_only(uuid, uuid, uuid, text, text, integer, integer, integer, numeric, boolean, boolean, integer, boolean) FROM anon;
REVOKE ALL ON FUNCTION public.can_submit_own_match_stats_update(uuid, uuid, uuid, participant_status, text, text, boolean, integer, boolean) FROM anon;

GRANT EXECUTE ON FUNCTION public.can_submit_own_match_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_update_own_match_status_only(uuid, uuid, uuid, text, text, integer, integer, integer, numeric, boolean, boolean, integer, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_submit_own_match_stats_update(uuid, uuid, uuid, participant_status, text, text, boolean, integer, boolean) TO authenticated;