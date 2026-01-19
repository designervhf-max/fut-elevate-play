-- Security Fix: Remove overly permissive INSERT policy on rating_history
-- The edge function uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS
-- No INSERT policy is needed; removing this prevents client-side data fabrication
DROP POLICY IF EXISTS "System can insert rating history" ON public.rating_history;