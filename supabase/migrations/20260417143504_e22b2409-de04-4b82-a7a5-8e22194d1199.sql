-- 1) Restrict phone column on profiles to owner only via column-level privileges.
-- The existing SELECT RLS policy still allows reading rows of co-members, so we
-- revoke the column-level SELECT on `phone` from authenticated/anon users.
-- Owners can still read their own phone via the security definer RPC `get_my_phone()`.
REVOKE SELECT (phone) ON public.profiles FROM anon, authenticated;

-- 2) Lock down user_subscriptions writes. There are currently no INSERT/UPDATE/DELETE
-- RLS policies, but because RLS is enabled, the absence of policies means writes are
-- denied by default for anon/authenticated. We add explicit restrictive policies to
-- make this intent crystal clear and defend in depth (no client can self-grant pro/admin).
CREATE POLICY "No client inserts on subscriptions"
ON public.user_subscriptions
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "No client updates on subscriptions"
ON public.user_subscriptions
FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

CREATE POLICY "No client deletes on subscriptions"
ON public.user_subscriptions
FOR DELETE
TO authenticated, anon
USING (false);