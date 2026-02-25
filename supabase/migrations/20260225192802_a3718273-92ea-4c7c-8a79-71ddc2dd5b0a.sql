-- Remove the overly permissive INSERT policy on rating_history
-- The edge function uses service_role key which bypasses RLS, so no INSERT policy is needed
DROP POLICY IF EXISTS "System can insert rating history" ON public.rating_history;