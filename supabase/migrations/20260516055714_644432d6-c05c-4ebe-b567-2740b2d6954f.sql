REVOKE ALL ON FUNCTION public.can_submit_own_match_stats(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_update_own_match_status(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_submit_own_match_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_update_own_match_status(uuid) TO authenticated;